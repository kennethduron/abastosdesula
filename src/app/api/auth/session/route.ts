import { cookies } from "next/headers";
import { z } from "zod";

import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin-config";
import {
  FIREBASE_SESSION_COOKIE,
  FIREBASE_SESSION_MAX_AGE_SECONDS,
  getAppSessionState,
} from "@/data/adapters/firebase/session";
import { getSanitizedServerError } from "@/server/safe-server-error";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

const sessionInputSchema = z
  .object({ idToken: z.string().min(100).max(10_000) })
  .strict();
const RECENT_SIGN_IN_SECONDS = 5 * 60;

export async function GET() {
  const state = await getAppSessionState();
  if (state.status === "authenticated") {
    return Response.json({ authenticated: true, role: state.session.role });
  }
  if (state.status === "invalid") {
    (await cookies()).delete(FIREBASE_SESSION_COOKIE);
  }
  const status = state.status === "unavailable" ? 503 : 401;
  return Response.json({ authenticated: false }, { status });
}

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return Response.json(
      { error: "Firebase no configurado." },
      { status: 503 },
    );
  }
  if (!hasTrustedSameOrigin(request)) {
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  const parsed = sessionInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Token inválido." }, { status: 400 });
  }
  let firebaseStage = "module-import";
  try {
    const { getFirebaseAdminAuth, getFirebaseAdminDb } =
      await import("@/data/adapters/firebase/admin");
    firebaseStage = "get-auth";
    const auth = getFirebaseAdminAuth();
    firebaseStage = "verify-id-token";
    const decoded = await auth.verifyIdToken(parsed.data.idToken, true);
    const authAgeSeconds = Date.now() / 1_000 - decoded.auth_time;
    if (authAgeSeconds < -60 || authAgeSeconds > RECENT_SIGN_IN_SECONDS) {
      return Response.json(
        { error: "Se requiere iniciar sesión nuevamente." },
        { status: 401 },
      );
    }
    const role = decoded.role;
    if (role !== "merchant" && role !== "institutional_admin") {
      return Response.json({ error: "Rol no autorizado." }, { status: 403 });
    }
    if (role === "merchant" && typeof decoded.businessId !== "string") {
      return Response.json(
        { error: "Comerciante sin negocio asignado." },
        { status: 403 },
      );
    }
    firebaseStage = "get-firestore";
    const db = getFirebaseAdminDb();
    firebaseStage = "read-user";
    const user = await db.collection("users").doc(decoded.uid).get();
    if (
      !user.exists ||
      user.data()?.active !== true ||
      user.data()?.role !== role
    ) {
      return Response.json(
        { error: "Cuenta inactiva o no autorizada." },
        { status: 403 },
      );
    }
    firebaseStage = "create-session-cookie";
    const sessionCookie = await auth.createSessionCookie(parsed.data.idToken, {
      expiresIn: FIREBASE_SESSION_MAX_AGE_SECONDS * 1000,
    });
    (await cookies()).set(FIREBASE_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FIREBASE_SESSION_MAX_AGE_SECONDS,
      priority: "high",
    });
    return Response.json({ role });
  } catch (error) {
    const diagnostic = getSanitizedServerError(error, firebaseStage);
    console.error("[firebase-auth] session creation failed", diagnostic);
    const { code } = diagnostic;
    const status = code.startsWith("auth/") ? 401 : 503;
    return Response.json(
      {
        error:
          status === 401
            ? "No fue posible crear la sesión."
            : "El servicio de acceso no está disponible temporalmente.",
      },
      { status },
    );
  }
}

export async function DELETE() {
  (await cookies()).delete(FIREBASE_SESSION_COOKIE);
  return new Response(null, { status: 204 });
}
