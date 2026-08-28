import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/data/adapters/firebase/admin";
import { getAppSessionState } from "@/data/adapters/firebase/session";
import { getLeasingAdminData } from "@/data/leasing-admin";
import {
  commercialSpaceAdminSchema,
  leasingInquiryUpdateSchema,
} from "@/domain";
import { requireInstitutionalAdmin } from "@/server/merchant-self-service/shared";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function GET() {
  const state = await getAppSessionState();
  if (
    state.status !== "authenticated" ||
    !["institutional_admin", "presentation_viewer"].includes(state.session.role)
  )
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  return Response.json(
    await getLeasingAdminData(state.session.role === "institutional_admin"),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const admin = await requireInstitutionalAdmin();
  if (!admin)
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  if (!hasTrustedSameOrigin(request))
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  const parsed = commercialSpaceAdminSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Revisa los datos del espacio." },
      { status: 400 },
    );
  const input = parsed.data;
  const reference = getFirebaseAdminDb()
    .collection("commercialSpaces")
    .doc(input.id || randomUUID());
  const coverImage = { src: input.coverImageSrc, alt: input.title };
  await reference.create({
    ...input,
    id: reference.id,
    images: [coverImage],
    coverImage,
    createdBy: admin.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return Response.json({ id: reference.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireInstitutionalAdmin();
  if (!admin)
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  if (!hasTrustedSameOrigin(request))
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  if ((body as { kind?: string }).kind === "inquiry") {
    const parsed = leasingInquiryUpdateSchema.safeParse(
      Object.fromEntries(
        Object.entries(body).filter(([key]) => key !== "kind"),
      ),
    );
    if (!parsed.success)
      return Response.json(
        { error: "Revisa el seguimiento ingresado." },
        { status: 400 },
      );
    const db = getFirebaseAdminDb();
    const inquiryReference = db
      .collection("leasingInquiries")
      .doc(parsed.data.inquiryId);
    const snapshot = await inquiryReference.get();
    if (!snapshot.exists)
      return Response.json(
        { error: "Solicitud no encontrada." },
        { status: 404 },
      );
    const current = snapshot.data()!;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.nextAction !== undefined)
      updates.nextAction = parsed.data.nextAction;
    if (parsed.data.followUpAt !== undefined)
      updates.followUpAt = parsed.data.followUpAt;
    if (parsed.data.note)
      updates.internalNotes = [
        ...(Array.isArray(current.internalNotes) ? current.internalNotes : []),
        {
          id: randomUUID(),
          body: parsed.data.note,
          createdAt: now,
          createdBy: admin.displayName,
        },
      ];
    const activityReference = db.collection("leasingActivities").doc();
    const descriptions = [
      parsed.data.status && parsed.data.status !== current.status
        ? "Estado actualizado"
        : "",
      parsed.data.note ? "Nota interna agregada" : "",
      parsed.data.followUpAt ? "Seguimiento programado" : "",
    ].filter(Boolean);
    const batch = db.batch();
    batch.update(inquiryReference, updates);
    batch.create(activityReference, {
      id: activityReference.id,
      inquiryId: parsed.data.inquiryId,
      type: parsed.data.note
        ? "note_added"
        : parsed.data.followUpAt
          ? "follow_up_scheduled"
          : "status_changed",
      description: descriptions.join(" · "),
      createdBy: admin.displayName,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return Response.json({ updated: true });
  }
  if ((body as { kind?: string }).kind === "space") {
    const parsed = commercialSpaceAdminSchema.safeParse(
      Object.fromEntries(
        Object.entries(body).filter(([key]) => key !== "kind"),
      ),
    );
    if (!parsed.success || !parsed.data.id)
      return Response.json(
        { error: "Revisa los datos del espacio." },
        { status: 400 },
      );
    const input = parsed.data;
    const spaceId = input.id;
    if (!spaceId)
      return Response.json(
        { error: "Espacio no encontrado." },
        { status: 400 },
      );
    const coverImage = { src: input.coverImageSrc, alt: input.title };
    const existing = await getFirebaseAdminDb()
      .collection("commercialSpaces")
      .doc(spaceId)
      .get();
    await getFirebaseAdminDb()
      .collection("commercialSpaces")
      .doc(spaceId)
      .set(
        {
          ...input,
          images: [coverImage],
          coverImage,
          updatedBy: admin.uid,
          updatedAt: FieldValue.serverTimestamp(),
          ...(!existing.exists
            ? { createdAt: FieldValue.serverTimestamp() }
            : {}),
        },
        { merge: true },
      );
    return Response.json({ updated: true });
  }
  return Response.json({ error: "Acción inválida." }, { status: 400 });
}
