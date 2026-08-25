import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { getFirebaseAdminDb } from "@/data/adapters/firebase/admin";
import { requireInstitutionalAdmin } from "@/server/merchant-self-service/shared";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

const schema = z
  .object({ status: z.enum(["active", "inactive", "pending"]) })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  if (!(await requireInstitutionalAdmin()))
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  if (!hasTrustedSameOrigin(request))
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return Response.json({ error: "Estado inválido." }, { status: 400 });
  const { businessId } = await params;
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(businessId))
    return Response.json({ error: "Negocio inválido." }, { status: 400 });
  const db = getFirebaseAdminDb();
  const businessReference = db.collection("businesses").doc(businessId);
  const business = await businessReference.get();
  if (!business.exists)
    return Response.json({ error: "Negocio no encontrado." }, { status: 404 });
  const [users, merchants] = await Promise.all([
    db
      .collection("users")
      .where("businessId", "==", businessId)
      .limit(25)
      .get(),
    db
      .collection("merchants")
      .where("businessId", "==", businessId)
      .limit(25)
      .get(),
  ]);
  const batch = db.batch();
  batch.update(businessReference, {
    status: input.data.status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  for (const merchant of merchants.docs)
    batch.update(merchant.ref, {
      status: input.data.status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  for (const user of users.docs)
    batch.update(user.ref, {
      active: input.data.status === "active",
      updatedAt: FieldValue.serverTimestamp(),
    });
  await batch.commit();
  return Response.json({ status: input.data.status });
}
