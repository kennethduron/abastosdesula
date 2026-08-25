import { FieldValue } from "firebase-admin/firestore";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "@/data/adapters/firebase/admin";
import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin-config";
import { merchantApplicationSchema } from "@/domain";
import { requestClientKey } from "@/server/merchant-self-service/shared";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";
import { SlidingWindowRateLimiter } from "@/server/security/sliding-window-rate-limit";

export const runtime = "nodejs";

const limiter = new SlidingWindowRateLimiter(3, 15 * 60_000);

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return Response.json(
      { error: "El servicio no está disponible en este momento." },
      { status: 503 },
    );
  }
  if (!hasTrustedSameOrigin(request)) {
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  const limit = limiter.consume(requestClientKey(request));
  if (!limit.allowed) {
    return Response.json(
      { error: "Espera unos minutos antes de intentarlo nuevamente." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1_000)),
        },
      },
    );
  }
  const parsed = merchantApplicationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      {
        error: "Revisa la información ingresada.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  let uid: string | null = null;
  try {
    const authUser = await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.responsibleName,
      disabled: false,
    });
    uid = authUser.uid;
    await auth.setCustomUserClaims(uid, { role: "merchant_applicant" });

    const applicationReference = db.collection("merchantApplications").doc();
    const batch = db.batch();
    batch.create(db.collection("users").doc(uid), {
      uid,
      email: input.email,
      displayName: input.responsibleName,
      role: "merchant_applicant",
      status: "pending",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(applicationReference, {
      id: applicationReference.id,
      userId: uid,
      responsibleName: input.responsibleName,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp,
      businessName: input.businessName,
      categoryId: input.categoryId,
      stall: input.stall,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return Response.json({ received: true }, { status: 201 });
  } catch (error) {
    if (uid) await auth.deleteUser(uid).catch(() => undefined);
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "unknown";
    if (code === "auth/email-already-exists") {
      return Response.json(
        {
          error:
            "Ya existe una cuenta con este correo. Usa la opción de recuperación de acceso.",
        },
        { status: 409 },
      );
    }
    console.error("[merchant-application] creation failed", { code });
    return Response.json(
      { error: "No fue posible recibir la solicitud en este momento." },
      { status: 503 },
    );
  }
}
