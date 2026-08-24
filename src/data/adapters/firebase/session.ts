import "server-only";

import { cookies } from "next/headers";

import type { UserRole } from "@/domain";

import { isFirebaseAdminConfigured } from "./admin-config";

export const FIREBASE_SESSION_COOKIE = "abastos_session";
export const FIREBASE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export interface VerifiedAppSession {
  uid: string;
  role: UserRole;
  businessId?: string;
  displayName: string;
}

export type AppSessionState =
  | { status: "authenticated"; session: VerifiedAppSession }
  | { status: "anonymous" | "invalid" | "unavailable" };

function safeErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return "unknown";
}

export async function getAppSessionState(): Promise<AppSessionState> {
  if (!isFirebaseAdminConfigured()) return { status: "unavailable" };
  const value = (await cookies()).get(FIREBASE_SESSION_COOKIE)?.value;
  if (!value) return { status: "anonymous" };
  try {
    const { getFirebaseAdminAuth, getFirebaseAdminDb } =
      await import("./admin");
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(
      value,
      true,
    );
    const role = decoded.role;
    if (role !== "merchant" && role !== "institutional_admin") {
      return { status: "invalid" };
    }
    const userRecord = await getFirebaseAdminDb()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const user = userRecord.data();
    if (!userRecord.exists || user?.active !== true || user.role !== role) {
      return { status: "invalid" };
    }
    const businessId =
      role === "merchant" && typeof decoded.businessId === "string"
        ? decoded.businessId
        : undefined;
    if (role === "merchant" && !businessId) return { status: "invalid" };
    return {
      status: "authenticated",
      session: {
        uid: decoded.uid,
        role,
        businessId,
        displayName:
          typeof user.displayName === "string" ? user.displayName : "Usuario",
      },
    };
  } catch (error) {
    const code = safeErrorCode(error);
    console.error("[firebase-session] verification failed", { code });
    return {
      status: code.startsWith("auth/") ? "invalid" : "unavailable",
    };
  }
}

export async function getVerifiedAppSession(): Promise<VerifiedAppSession | null> {
  const state = await getAppSessionState();
  return state.status === "authenticated" ? state.session : null;
}
