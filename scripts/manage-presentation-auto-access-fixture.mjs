import {
  applicationDefault,
  cert,
  deleteApp,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createRequire } from "node:module";
import { resolve } from "node:path";

delete process.env.DEBUG;

const projectId = process.env.FIREBASE_PROJECT_ID;
const email = process.env.AUTO_ACCESS_FIXTURE_EMAIL?.trim().toLowerCase();
const password = process.env.AUTO_ACCESS_FIXTURE_PASSWORD;
const action = process.env.AUTO_ACCESS_FIXTURE_ACTION;
const confirmation = process.env.AUTO_ACCESS_FIXTURE_CONFIRM;
const fixtureDisplayName = "Controlled presentation access audit";

if (
  projectId !== "abastosdesula-demo" ||
  confirmation !== "presentation-auto-access" ||
  !email ||
  !password ||
  !["create", "cleanup"].includes(action)
) {
  throw new Error("La operación controlada no está autorizada.");
}
if (
  password.length < 12 ||
  !/[A-Z]/.test(password) ||
  !/[a-z]/.test(password) ||
  !/\d/.test(password) ||
  !/[^A-Za-z0-9]/.test(password)
) {
  throw new Error("La credencial controlada no cumple la política mínima.");
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
    throw new Error("No hay una credencial local autorizada para Firebase.");
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

const credential = explicitCredentials
  ? cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    })
  : process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? applicationDefault()
    : firebaseCliCredential();
const app = initializeApp({ projectId, credential }, "auto-access-audit");
const auth = getAuth(app);
const firestoreUserUrl = (uid) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;

async function authorizedRequest(url, init = {}) {
  const token = await credential.getAccessToken();
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

async function findFixtureUser() {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

try {
  if (action === "create") {
    const existing = await findFixtureUser();
    if (existing && existing.displayName !== fixtureDisplayName) {
      throw new Error(
        "La cuenta objetivo existe y no pertenece a la auditoría.",
      );
    }
    const user = existing
      ? await auth.updateUser(existing.uid, {
          password,
          disabled: false,
          emailVerified: true,
        })
      : await auth.createUser({
          email,
          password,
          displayName: fixtureDisplayName,
          emailVerified: true,
        });

    const profile = await authorizedRequest(firestoreUserUrl(user.uid));
    if (profile.ok) {
      const document = await profile.json();
      if (document.fields?.email?.stringValue !== email) {
        throw new Error("El perfil objetivo no pertenece a la auditoría.");
      }
      const deleted = await authorizedRequest(firestoreUserUrl(user.uid), {
        method: "DELETE",
      });
      if (!deleted.ok) {
        throw new Error("No fue posible limpiar el perfil controlado.");
      }
    } else if (profile.status !== 404) {
      throw new Error("No fue posible comprobar el perfil controlado.");
    }
    await auth.setCustomUserClaims(user.uid, {});
    console.log(
      "Cuenta controlada creada sin rol ni perfil. Credenciales omitidas.",
    );
  } else {
    const user = await findFixtureUser();
    if (!user) {
      console.log("La cuenta controlada ya no existe.");
    } else {
      if (user.displayName !== fixtureDisplayName) {
        throw new Error("La cuenta objetivo no pertenece a la auditoría.");
      }
      const profile = await authorizedRequest(firestoreUserUrl(user.uid));
      if (profile.ok) {
        const document = await profile.json();
        if (document.fields?.email?.stringValue !== email) {
          throw new Error("El perfil objetivo no pertenece a la auditoría.");
        }
        const deleted = await authorizedRequest(firestoreUserUrl(user.uid), {
          method: "DELETE",
        });
        if (!deleted.ok) {
          throw new Error("No fue posible retirar el perfil controlado.");
        }
      } else if (profile.status !== 404) {
        throw new Error("No fue posible comprobar el perfil controlado.");
      }
      await auth.deleteUser(user.uid);
      console.log("Cuenta y perfil controlados retirados.");
    }
  }
} finally {
  await deleteApp(app);
}
