import { createPrivateKey } from "node:crypto";
import { cert, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const expectedProjectId = "abastosdesula-demo";
const firebaseEnvironment = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];
const demoEnvironment = [
  "DEMO_MERCHANT_EMAIL",
  "DEMO_MERCHANT_PASSWORD",
  "DEMO_MERCHANT_B_EMAIL",
  "DEMO_MERCHANT_B_PASSWORD",
  "DEMO_ADMIN_EMAIL",
  "DEMO_ADMIN_PASSWORD",
  "DEMO_SEED_CONFIRM",
];
const auditedEnvironment = [...firebaseEnvironment, ...demoEnvironment];
const environment = Object.fromEntries(
  auditedEnvironment.map((name) => [
    name,
    process.env[name]?.trim() ? "PRESENT" : "MISSING",
  ]),
);
const secrets = auditedEnvironment
  .map((name) => process.env[name])
  .filter((value) => typeof value === "string" && value.length > 0)
  .sort((left, right) => right.length - left.length);

function sanitize(value) {
  let output = String(value ?? "unknown");
  for (const secret of secrets)
    output = output.replaceAll(secret, "[REDACTED]");
  return output
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, "[REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED]");
}

let app;
let stage = "environment";
try {
  if (firebaseEnvironment.some((name) => environment[name] === "MISSING")) {
    throw new Error("Required Firebase environment is missing.");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID.trim();
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim();
  const project = projectId === expectedProjectId ? "VALID" : "INVALID";
  const projectMatch = projectId === clientProjectId ? "VALID" : "INVALID";
  const seedConfirmation = process.env.DEMO_SEED_CONFIRM
    ? process.env.DEMO_SEED_CONFIRM === expectedProjectId
      ? "VALID"
      : "INVALID"
    : "MISSING";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL.trim();
  const clientEmailFormat = /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(
    clientEmail,
  )
    ? "VALID"
    : "INVALID";
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(
    /\\n/g,
    "\n",
  ).trim();

  stage = "private-key";
  createPrivateKey(privateKey);
  const privateKeyFormat =
    privateKey.includes("-----BEGIN PRIVATE KEY-----") &&
    privateKey.includes("-----END PRIVATE KEY-----")
      ? "VALID"
      : "INVALID";
  if (
    [project, projectMatch, clientEmailFormat, privateKeyFormat].includes(
      "INVALID",
    )
  ) {
    throw new Error("Environment validation failed.");
  }

  stage = "initialize";
  app = initializeApp(
    { projectId, credential: cert({ projectId, clientEmail, privateKey }) },
    "firebase-demo-readonly-audit",
  );
  const db = getFirestore(app);
  const auth = getAuth(app);

  stage = "firestore";
  const knownCollections = [
    "activities",
    "businesses",
    "categories",
    "customers",
    "merchants",
    "notifications",
    "products",
    "quoteRequests",
    "users",
  ];
  const collectionCounts = {};
  for (const name of knownCollections) {
    const snapshot = await db.collection(name).count().get();
    collectionCounts[name] = snapshot.data().count;
  }

  stage = "auth";
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  const expectedUsers = [
    {
      key: "merchantA",
      email: process.env.DEMO_MERCHANT_EMAIL,
      role: "merchant",
      businessId: "business-frutas-valle",
    },
    {
      key: "merchantB",
      email: process.env.DEMO_MERCHANT_B_EMAIL,
      role: "merchant",
      businessId: "business-la-huerta",
    },
    {
      key: "institutionalAdmin",
      email: process.env.DEMO_ADMIN_EMAIL,
      role: "institutional_admin",
    },
  ].filter((expected) => expected.email);
  const expectedUserStatus = {};
  let matchedUsers = 0;
  for (const expected of expectedUsers) {
    const user = users.find((candidate) => candidate.email === expected.email);
    const claimsValid =
      user?.customClaims?.role === expected.role &&
      (expected.businessId === undefined ||
        user?.customClaims?.businessId === expected.businessId);
    expectedUserStatus[expected.key] = user
      ? {
          user: "PRESENT",
          enabled: user.disabled ? "INVALID" : "VALID",
          claims: claimsValid ? "VALID" : "INVALID",
        }
      : { user: "MISSING", enabled: "MISSING", claims: "MISSING" };
    if (user) matchedUsers += 1;
  }

  console.log(
    JSON.stringify({
      environment,
      firebase: {
        project,
        clientServerProjectMatch: projectMatch,
        clientEmail: clientEmailFormat,
        privateKey: privateKeyFormat,
        seedConfirmation,
        adminCredential: "VALID",
      },
      firestore: {
        database: "PRESENT",
        collectionCounts,
        empty: Object.values(collectionCounts).every((count) => count === 0),
      },
      auth: {
        totalUsers: users.length,
        expectedUsers: expectedUserStatus,
        otherUsers: users.length - matchedUsers,
      },
    }),
  );
} catch (error) {
  console.log(
    JSON.stringify({
      environment,
      stage,
      code: sanitize(error?.code),
      name: sanitize(error?.name),
      message: sanitize(error?.message),
    }),
  );
  process.exitCode = 1;
} finally {
  if (app) await deleteApp(app);
}
