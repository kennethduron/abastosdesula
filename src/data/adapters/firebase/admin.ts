import "server-only";

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { getFirebaseAdminRuntimeConfig } from "./admin-config";

export { isFirebaseAdminConfigured } from "./admin-config";

export function getFirebaseAdminApp() {
  if (getApps().length) return getApp();
  const { projectId, clientEmail, privateKey } =
    getFirebaseAdminRuntimeConfig();
  const useExplicitCredentials = Boolean(clientEmail && privateKey);
  return initializeApp({
    projectId,
    credential: useExplicitCredentials
      ? cert({
          projectId,
          clientEmail,
          privateKey,
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
