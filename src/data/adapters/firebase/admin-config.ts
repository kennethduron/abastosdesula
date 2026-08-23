import "server-only";

import { createPrivateKey } from "node:crypto";

export type FirebaseAdminConfigStatus = "ready" | "missing" | "invalid";

const projectIdPattern = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const clientEmailPattern = /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/;

export function normalizeFirebasePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

function hasValidPrivateKey(value: string) {
  const normalized = normalizeFirebasePrivateKey(value);
  if (
    !normalized.includes("-----BEGIN PRIVATE KEY-----") ||
    !normalized.includes("-----END PRIVATE KEY-----")
  ) {
    return false;
  }
  try {
    createPrivateKey(normalized);
    return true;
  } catch {
    return false;
  }
}

export function getFirebaseAdminConfigStatus(): FirebaseAdminConfigStatus {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) return "missing";
  if (!projectIdPattern.test(projectId)) return "invalid";

  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (publicProjectId && publicProjectId !== projectId) return "invalid";

  if (
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    return "ready";
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return "missing";
  if (
    !clientEmailPattern.test(clientEmail) ||
    !hasValidPrivateKey(privateKey)
  ) {
    return "invalid";
  }
  return "ready";
}

export function isFirebaseAdminConfigured() {
  return getFirebaseAdminConfigStatus() === "ready";
}

export function isLocalFirebaseFallbackAllowed() {
  return (
    process.env.ABASTOS_E2E_LOCAL_FALLBACK === "true" && !process.env.VERCEL
  );
}

export function getFirebaseAdminRuntimeConfig() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin server configuration is unavailable.");
  }
  const projectId = process.env.FIREBASE_PROJECT_ID!.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return {
    projectId,
    clientEmail,
    privateKey: privateKey
      ? normalizeFirebasePrivateKey(privateKey)
      : undefined,
  };
}
