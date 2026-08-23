import "client-only";

import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

import { getFirebaseApp } from "@/data/adapters/firebase/app-client";

let authInstance: Auth | null = null;
let emulatorConnected = false;

export function getFirebaseAuth() {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
    !emulatorConnected
  ) {
    connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    emulatorConnected = true;
  }
  return authInstance;
}
