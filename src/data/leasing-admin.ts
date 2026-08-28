import "server-only";

import { presentationCommercialSpaces } from "@/data/commercial-spaces";
import type { CommercialSpace, LeasingInquiry } from "@/domain";

const controlledAuditInquiry: LeasingInquiry = {
  id: "controlled-local-audit",
  reference: "LAS-20260828-AUD001",
  commercialSpaceId: "space-wide-retail",
  commercialSpaceTitle: "Local comercial amplio",
  customerName: "Contacto de auditoría",
  phone: "99990000",
  whatsapp: "99990000",
  email: "auditoria@example.com",
  company: "Negocio de referencia",
  businessType: "Distribución de alimentos",
  intendedUse: "Distribución y almacenamiento de alimentos empacados.",
  requestedStartDate: "2026-10-01",
  notes: "Registro local controlado para validar el flujo institucional.",
  contactPreference: "whatsapp",
  status: "new",
  internalNotes: [],
  activity: [
    {
      id: "controlled-local-audit-created",
      inquiryId: "controlled-local-audit",
      type: "created",
      description: "Solicitud recibida desde el sitio público",
      createdAt: "2026-08-28T14:00:00.000Z",
      createdBy: "Formulario público",
    },
  ],
  nextAction: "Confirmar necesidades del espacio",
  source: "public_spaces",
  createdAt: "2026-08-28T14:00:00.000Z",
  updatedAt: "2026-08-28T14:00:00.000Z",
};

function iso(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value)
    return (value as { toDate(): Date }).toDate().toISOString();
  return typeof value === "string" ? value : "";
}

export function serializeLeasingInquiry(
  id: string,
  data: FirebaseFirestore.DocumentData,
): LeasingInquiry {
  return {
    id,
    reference: String(data.reference ?? id),
    commercialSpaceId: String(data.commercialSpaceId ?? ""),
    commercialSpaceTitle: String(
      data.commercialSpaceTitle ?? "Espacio comercial",
    ),
    customerName: String(data.customerName ?? ""),
    phone: String(data.phone ?? ""),
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    company: typeof data.company === "string" ? data.company : undefined,
    businessType: String(data.businessType ?? ""),
    intendedUse: String(data.intendedUse ?? ""),
    requestedStartDate:
      typeof data.requestedStartDate === "string"
        ? data.requestedStartDate
        : undefined,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    contactPreference:
      data.contactPreference === "phone" || data.contactPreference === "email"
        ? data.contactPreference
        : "whatsapp",
    status: [
      "new",
      "contacted",
      "visit_scheduled",
      "proposal_sent",
      "negotiating",
      "approved",
      "closed",
      "not_interested",
    ].includes(data.status)
      ? data.status
      : "new",
    internalNotes: Array.isArray(data.internalNotes)
      ? data.internalNotes.map((note: Record<string, unknown>) => ({
          id: String(note.id ?? ""),
          body: String(note.body ?? ""),
          createdAt: iso(note.createdAt),
          createdBy: String(note.createdBy ?? "Administración"),
        }))
      : [],
    activity: [],
    nextAction:
      typeof data.nextAction === "string" ? data.nextAction : undefined,
    followUpAt:
      iso(data.followUpAt) ||
      (typeof data.followUpAt === "string" ? data.followUpAt : undefined),
    assignedTo:
      typeof data.assignedTo === "string" ? data.assignedTo : undefined,
    source: "public_spaces",
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  } as LeasingInquiry;
}

function serializeSpace(
  base: CommercialSpace | undefined,
  id: string,
  data: FirebaseFirestore.DocumentData,
): CommercialSpace | null {
  if (!base && typeof data.slug !== "string") return null;
  const fallback = base ?? presentationCommercialSpaces[0];
  return {
    ...fallback,
    ...data,
    id,
    images: Array.isArray(data.images) ? data.images : fallback.images,
    coverImage: data.coverImage ?? fallback.coverImage,
    createdAt: iso(data.createdAt) || fallback.createdAt,
    updatedAt: iso(data.updatedAt) || fallback.updatedAt,
  } as CommercialSpace;
}

export async function getLeasingAdminData(includePersonalData: boolean) {
  const { isFirebaseAdminConfigured } =
    await import("@/data/adapters/firebase/admin-config");
  if (!isFirebaseAdminConfigured())
    return {
      spaces: presentationCommercialSpaces,
      inquiries: [controlledAuditInquiry],
      unreadCount: 1,
    };
  const { getFirebaseAdminDb } = await import("@/data/adapters/firebase/admin");
  const db = getFirebaseAdminDb();
  const [
    spaceSnapshot,
    inquirySnapshot,
    notificationSnapshot,
    activitySnapshot,
  ] = await Promise.all([
    db.collection("commercialSpaces").limit(100).get(),
    includePersonalData
      ? db
          .collection("leasingInquiries")
          .orderBy("createdAt", "desc")
          .limit(200)
          .get()
      : Promise.resolve(null),
    includePersonalData
      ? db
          .collection("institutionalNotifications")
          .where("readAt", "==", null)
          .limit(100)
          .get()
      : Promise.resolve(null),
    includePersonalData
      ? db.collection("leasingActivities").limit(400).get()
      : Promise.resolve(null),
  ]);
  const overrides = new Map(
    spaceSnapshot.docs.map((doc) => [doc.id, doc.data()]),
  );
  const spaces = presentationCommercialSpaces.map((space) => {
    const stored = overrides.get(space.id);
    return stored ? serializeSpace(space, space.id, stored) : space;
  });
  for (const doc of spaceSnapshot.docs)
    if (!spaces.some((space) => space?.id === doc.id))
      spaces.push(serializeSpace(undefined, doc.id, doc.data())!);
  return {
    spaces: spaces.filter(Boolean) as CommercialSpace[],
    inquiries:
      inquirySnapshot?.docs.map((doc) => {
        const inquiry = serializeLeasingInquiry(doc.id, doc.data());
        inquiry.activity =
          activitySnapshot?.docs
            .filter((activity) => activity.data().inquiryId === doc.id)
            .map((activity) => {
              const data = activity.data();
              return {
                id: activity.id,
                inquiryId: doc.id,
                type:
                  data.type === "status_changed" ||
                  data.type === "note_added" ||
                  data.type === "follow_up_scheduled"
                    ? data.type
                    : "created",
                description: String(data.description ?? "Actividad registrada"),
                createdAt: iso(data.createdAt),
                createdBy: String(data.createdBy ?? "Administración"),
              };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)) ?? [];
        return inquiry;
      }) ?? [],
    unreadCount: notificationSnapshot?.size ?? 0,
  };
}
