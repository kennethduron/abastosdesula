import "server-only";

import { cookies } from "next/headers";

import type { UserRole } from "@/domain";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  isFirebaseAdminConfigured,
} from "./admin";

export const FIREBASE_SESSION_COOKIE = "abastos_session";
export const FIREBASE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export interface VerifiedAppSession {
  uid: string;
  role: UserRole;
  businessId?: string;
  displayName: string;
}

export async function getVerifiedAppSession(): Promise<VerifiedAppSession | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const value = (await cookies()).get(FIREBASE_SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(
      value,
      true,
    );
    const role = decoded.role;
    if (role !== "merchant" && role !== "institutional_admin") return null;
    const userRecord = await getFirebaseAdminDb()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const user = userRecord.data();
    if (!userRecord.exists || user?.active !== true || user.role !== role) {
      return null;
    }
    const businessId =
      role === "merchant" && typeof decoded.businessId === "string"
        ? decoded.businessId
        : undefined;
    if (role === "merchant" && !businessId) return null;
    return {
      uid: decoded.uid,
      role,
      businessId,
      displayName:
        typeof user.displayName === "string"
          ? user.displayName
          : "Usuario demo",
    };
  } catch {
    return null;
  }
}
