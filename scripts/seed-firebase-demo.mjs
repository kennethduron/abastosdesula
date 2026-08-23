import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

import {
  businesses,
  categories,
  merchants,
  privateFixtures,
  products,
} from "./firebase-demo-data.mjs";

const required = [
  "FIREBASE_PROJECT_ID",
  "DEMO_MERCHANT_EMAIL",
  "DEMO_MERCHANT_PASSWORD",
  "DEMO_MERCHANT_B_EMAIL",
  "DEMO_MERCHANT_B_PASSWORD",
  "DEMO_ADMIN_EMAIL",
  "DEMO_ADMIN_PASSWORD",
  "DEMO_SEED_CONFIRM",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Faltan variables requeridas: ${missing.join(", ")}`);
}
if (process.env.DEMO_SEED_CONFIRM !== "abastosdesula-demo") {
  throw new Error("DEMO_SEED_CONFIRM no autoriza el seed de demostración.");
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const explicitCredentials = Boolean(
  process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY,
);
const app =
  getApps()[0] ??
  initializeApp({
    projectId,
    credential: explicitCredentials
      ? cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        })
      : applicationDefault(),
  });
const auth = getAuth(app);
const db = getFirestore(app);

async function mergeKnownDocuments(collectionName, documents) {
  const batch = db.batch();
  for (const document of documents) {
    batch.set(db.collection(collectionName).doc(document.id), document, {
      merge: true,
    });
  }
  await batch.commit();
}

async function createPrivateFixtureIfMissing(fixture) {
  const quoteRef = db.collection("quoteRequests").doc(fixture.id);
  if ((await quoteRef.get()).exists) return false;
  const timestamp = Timestamp.now();
  const customerRef = db.collection("customers").doc(fixture.customerId);
  const activityRef = db.collection("activities").doc(`activity-${fixture.id}`);
  const notificationRef = db
    .collection("notifications")
    .doc(`notification-${fixture.id}`);
  const [customer, activity, notification] = await Promise.all([
    customerRef.get(),
    activityRef.get(),
    notificationRef.get(),
  ]);
  const batch = db.batch();
  if (!customer.exists) {
    batch.create(customerRef, {
      id: fixture.customerId,
      businessId: fixture.businessId,
      name: fixture.customerName,
      type: fixture.customerType,
      phone: fixture.phone,
      isDemo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  batch.create(quoteRef, {
    ...fixture,
    status: "new",
    history: [{ status: "new", changedAt: timestamp.toDate().toISOString() }],
    isDemo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  if (!activity.exists) {
    batch.create(activityRef, {
      id: activityRef.id,
      businessId: fixture.businessId,
      type: "quote_request_created",
      entityType: "quote_request",
      entityId: fixture.id,
      description: "Nueva solicitud demo recibida",
      isDemo: true,
      createdAt: timestamp,
    });
  }
  if (!notification.exists) {
    batch.create(notificationRef, {
      id: notificationRef.id,
      businessId: fixture.businessId,
      type: "quote_request_created",
      title: "Nueva solicitud demo",
      body: "Hay una nueva solicitud pendiente de revisión.",
      entityType: "quote_request",
      entityId: fixture.id,
      readAt: null,
      isDemo: true,
      createdAt: timestamp,
    });
  }
  await batch.commit();
  return true;
}

async function upsertUser({ email, password, displayName, role, businessId }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    user = await auth.updateUser(user.uid, {
      password,
      displayName,
      disabled: false,
    });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email, password, displayName });
  }
  const claims = businessId ? { role, businessId } : { role };
  await auth.setCustomUserClaims(user.uid, claims);
  await db
    .collection("users")
    .doc(user.uid)
    .set(
      {
        id: user.uid,
        email,
        displayName,
        role,
        active: true,
        businessId: businessId ?? null,
        isDemo: true,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  return user.uid;
}

await upsertUser({
  email: process.env.DEMO_MERCHANT_EMAIL,
  password: process.env.DEMO_MERCHANT_PASSWORD,
  displayName: "Comercial Frutas del Valle",
  role: "merchant",
  businessId: "business-frutas-valle",
});
await upsertUser({
  email: process.env.DEMO_MERCHANT_B_EMAIL,
  password: process.env.DEMO_MERCHANT_B_PASSWORD,
  displayName: "Verduras La Huerta",
  role: "merchant",
  businessId: "business-la-huerta",
});
await upsertUser({
  email: process.env.DEMO_ADMIN_EMAIL,
  password: process.env.DEMO_ADMIN_PASSWORD,
  displayName: "Administración Central Demo",
  role: "institutional_admin",
});

await mergeKnownDocuments("businesses", businesses);
await mergeKnownDocuments("categories", categories);
await mergeKnownDocuments("merchants", merchants);
await mergeKnownDocuments("products", products);
let createdFixtures = 0;
for (const fixture of privateFixtures) {
  if (await createPrivateFixtureIfMissing(fixture)) createdFixtures += 1;
}

console.log(
  `Firebase demo preparado: 6 comercios, 12 productos y ${createdFixtures} solicitudes nuevas. Credenciales omitidas.`,
);
