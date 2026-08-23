import "client-only";

import { getApp, getApps, initializeApp } from "firebase/app";

import {
  firebasePublicConfig,
  isFirebaseClientConfigured,
} from "@/data/adapters/firebase/config";

export function getFirebaseApp() {
  if (!isFirebaseClientConfigured()) {
    throw new Error("Firebase web no está configurado.");
  }
  return getApps().length ? getApp() : initializeApp(firebasePublicConfig);
}
