export const firebasePublicConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export type FirebaseClientConfigStatus = "ready" | "missing" | "invalid";

export function getFirebaseClientConfigStatus(): FirebaseClientConfigStatus {
  if (Object.values(firebasePublicConfig).some((value) => !value?.trim())) {
    return "missing";
  }

  const {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  } = firebasePublicConfig as Record<keyof typeof firebasePublicConfig, string>;
  const valid =
    /^AIza[A-Za-z0-9_-]{30,}$/.test(apiKey) &&
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(authDomain) &&
    /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) &&
    /^[a-z0-9.-]+\.(?:appspot\.com|firebasestorage\.app)$/i.test(
      storageBucket,
    ) &&
    /^\d+$/.test(messagingSenderId) &&
    /^\d+:\d+:web:[a-f0-9]+$/i.test(appId);
  return valid ? "ready" : "invalid";
}

export function isFirebaseClientConfigured() {
  return getFirebaseClientConfigStatus() === "ready";
}
