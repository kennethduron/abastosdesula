import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import { tenantAccounts, tenantPayments } from "./tenant-self-service-data.mjs";

const required = [
  "FIREBASE_PROJECT_ID",
  "PRESENTATION_EMAIL",
  "PRESENTATION_PASSWORD",
  "PRESENTATION_PROVISION_CONFIRM",
];
delete process.env.DEBUG;
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Faltan variables requeridas: ${missing.join(", ")}`);
}
if (
  process.env.FIREBASE_PROJECT_ID !== "abastosdesula-demo" ||
  process.env.PRESENTATION_PROVISION_CONFIRM !== "tenant-self-service"
) {
  throw new Error("La provisión no está autorizada para este proyecto.");
}

const email = process.env.PRESENTATION_EMAIL.trim().toLowerCase();
const password = process.env.PRESENTATION_PASSWORD;
if (!/^[^@\s]{3,32}@[^@\s]+\.[^@\s]+$/.test(email)) {
  throw new Error("El correo de presentación no es válido.");
}
if (
  password.length < 12 ||
  !/[A-Z]/.test(password) ||
  !/[a-z]/.test(password) ||
  !/\d/.test(password) ||
  !/[^A-Za-z0-9]/.test(password)
) {
  throw new Error(
    "La contraseña de presentación no cumple la política mínima.",
  );
}

const explicitCredentials = Boolean(
  process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY,
);

function firebaseCliCredential() {
  const require = createRequire(import.meta.url);
  const firebaseAuth = require(
    resolve("node_modules/firebase-tools/lib/auth.js"),
  );
  const account = firebaseAuth.getProjectDefaultAccount(process.cwd());
  if (!account?.tokens?.refresh_token) {
    throw new Error(
      "No hay credenciales de servicio ni una sesión local de Firebase CLI.",
    );
  }
  const scopes = account.tokens.scopes ?? [
    "openid",
    "email",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/firebase",
  ];
  return {
    async getAccessToken() {
      const token = await firebaseAuth.getAccessToken(
        account.tokens.refresh_token,
        scopes,
      );
      return {
        access_token: token.access_token,
        expires_in: Math.max(
          60,
          Math.floor(
            ((token.expires_at ?? Date.now() + 3_600_000) - Date.now()) / 1_000,
          ),
        ),
      };
    },
  };
}

const selectedCredential = explicitCredentials
  ? cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    })
  : process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? applicationDefault()
    : firebaseCliCredential();
const app =
  getApps()[0] ??
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: selectedCredential,
  });
const auth = getAuth(app);
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (typeof value === "string") return { stringValue: value };
  throw new Error("El registro controlado contiene un valor no soportado.");
}

function toFirestoreFields(document) {
  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => [
      key,
      toFirestoreValue(value),
    ]),
  );
}

async function authorizedRequest(path, init = {}) {
  const token = await selectedCredential.getAccessToken();
  return fetch(`${firestoreBase}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

async function mergeDocument(collectionName, document) {
  const query = new URLSearchParams();
  for (const field of Object.keys(document)) {
    query.append("updateMask.fieldPaths", field);
  }
  const response = await authorizedRequest(
    `${collectionName}/${document.id}?${query.toString()}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields: toFirestoreFields(document) }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `No fue posible actualizar ${collectionName}/${document.id} (HTTP ${response.status}).`,
    );
  }
}

async function mergeControlledDocuments(collectionName, documents) {
  for (const document of documents) {
    const response = await authorizedRequest(
      `${collectionName}/${document.id}`,
    );
    if (response.status !== 404 && !response.ok) {
      throw new Error(
        `No fue posible comprobar ${collectionName}/${document.id} (HTTP ${response.status}).`,
      );
    }
    if (response.ok) {
      const existing = await response.json();
      if (existing.fields?.isDemo?.booleanValue !== true) {
        throw new Error(
          `Provisión bloqueada: ${collectionName}/${document.id} no es un registro controlado.`,
        );
      }
    }
  }
  for (const document of documents) {
    if (document.isDemo !== true) {
      throw new Error(
        `Provisión bloqueada: ${collectionName}/${document.id} no está marcado como controlado.`,
      );
    }
    await mergeDocument(collectionName, document);
  }
}

let user;
try {
  user = await auth.getUserByEmail(email);
  user = await auth.updateUser(user.uid, {
    password,
    displayName: "Presentación institucional",
    disabled: false,
  });
} catch (error) {
  if (error.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({
    email,
    password,
    displayName: "Presentación institucional",
    emailVerified: true,
  });
}

await auth.setCustomUserClaims(user.uid, { role: "presentation_viewer" });
await mergeDocument("users", {
  id: user.uid,
  email,
  displayName: "Presentación institucional",
  role: "presentation_viewer",
  active: true,
  businessId: null,
  isDemo: true,
  updatedAt: new Date().toISOString(),
});
await mergeControlledDocuments("tenantAccounts", tenantAccounts);
await mergeControlledDocuments("tenantPayments", tenantPayments);

console.log(
  `Autogestión preparada: ${tenantAccounts.length} cuentas y ${tenantPayments.length} movimientos. Credenciales omitidas.`,
);
