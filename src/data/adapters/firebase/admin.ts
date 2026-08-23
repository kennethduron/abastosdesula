import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    (process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)),
  );
}

export function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin no está configurado.");
  }
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const useExplicitCredentials = Boolean(
    process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY,
  );
  return initializeApp({
    projectId,
    credential: useExplicitCredentials
      ? cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        })
      : applicationDefault(),
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
