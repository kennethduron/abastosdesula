import { FieldValue } from "firebase-admin/firestore";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "@/data/adapters/firebase/admin";
import { getAppSessionState } from "@/data/adapters/firebase/session";
import { changePasswordSchema } from "@/domain";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasTrustedSameOrigin(request))
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  const state = await getAppSessionState();
  if (state.status !== "authenticated" || state.session.role !== "merchant") {
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  }
  const parsed = changePasswordSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "La contraseña no cumple los requisitos." },
      { status: 400 },
    );

  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const authUser = await auth.getUser(state.session.uid);
  const { mustChangePassword: _mustChangePassword, ...claims } =
    authUser.customClaims ?? {};
  void _mustChangePassword;
  await auth.updateUser(state.session.uid, { password: parsed.data.password });
  await auth.setCustomUserClaims(state.session.uid, claims);
  await db.collection("users").doc(state.session.uid).set(
    {
      mustChangePassword: false,
      passwordChangedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return Response.json({ changed: true });
}
