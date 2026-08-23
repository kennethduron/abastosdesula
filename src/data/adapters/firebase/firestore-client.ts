import "client-only";

import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

import { getFirebaseApp } from "@/data/adapters/firebase/app-client";

let firestoreInstance: Firestore | null = null;
let emulatorConnected = false;

export function getFirebaseDb() {
  if (firestoreInstance) return firestoreInstance;
  firestoreInstance = getFirestore(getFirebaseApp());
  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
    !emulatorConnected
  ) {
    connectFirestoreEmulator(firestoreInstance, "127.0.0.1", 8080);
    emulatorConnected = true;
  }
  return firestoreInstance;
}
