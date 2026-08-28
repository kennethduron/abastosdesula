import "server-only";

import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/data/adapters/firebase/admin";
import { getPresentationCommercialSpace } from "@/data/commercial-spaces";
import type { PublicLeasingInquiryInput } from "@/domain";

export async function createFirebaseLeasingInquiry(
  input: PublicLeasingInquiryInput,
) {
  const db = getFirebaseAdminDb();
  const controlled = getPresentationCommercialSpace(input.commercialSpaceId);
  const spaceSnapshot = await db
    .collection("commercialSpaces")
    .doc(input.commercialSpaceId)
    .get();
  const stored = spaceSnapshot.data();
  if (spaceSnapshot.exists && stored?.published !== true)
    throw new Error("El espacio seleccionado no está publicado.");
  if (!controlled && (!spaceSnapshot.exists || stored?.published !== true))
    throw new Error("El espacio seleccionado no fue encontrado.");
  const title =
    typeof stored?.title === "string" ? stored.title : controlled!.title;
  const inquiryReference = db.collection("leasingInquiries").doc();
  const activityReference = db.collection("leasingActivities").doc();
  const notificationReference = db
    .collection("institutionalNotifications")
    .doc();
  const reference = `LAS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const common = {
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const inquiry = {
    id: inquiryReference.id,
    reference,
    commercialSpaceId: input.commercialSpaceId,
    commercialSpaceTitle: title,
    customerName: input.fullName,
    phone: input.phone,
    ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.company ? { company: input.company } : {}),
    businessType: input.businessType,
    intendedUse: input.intendedUse,
    ...(input.requestedStartDate
      ? { requestedStartDate: input.requestedStartDate }
      : {}),
    ...(input.comments ? { notes: input.comments } : {}),
    contactPreference: input.contactPreference,
    status: "new",
    internalNotes: [],
    source: "public_spaces",
    ...common,
  };
  const batch = db.batch();
  batch.create(inquiryReference, inquiry);
  batch.create(activityReference, {
    id: activityReference.id,
    inquiryId: inquiryReference.id,
    type: "created",
    description: `Nueva solicitud ${reference} para ${title}`,
    createdBy: "public_form",
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.create(notificationReference, {
    id: notificationReference.id,
    type: "leasing_inquiry_created",
    inquiryId: inquiryReference.id,
    reference,
    title: "Nueva solicitud de local",
    description: `${input.fullName} consultó por ${title}`,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { id: inquiryReference.id, reference };
}
