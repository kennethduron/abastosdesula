import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "@/data/adapters/firebase/admin";
import { getAppSessionState } from "@/data/adapters/firebase/session";
import {
  requireInstitutionalAdmin,
  slugifyBusiness,
} from "@/server/merchant-self-service/shared";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

const decisionSchema = z
  .object({
    applicationId: z.string().min(1).max(160),
    decision: z.enum(["approved", "rejected"]),
  })
  .strict();

function serializeApplication(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  const createdAt = data.createdAt?.toDate?.();
  return {
    id,
    responsibleName: String(data.responsibleName ?? ""),
    businessName: String(data.businessName ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    categoryId: String(data.categoryId ?? ""),
    stall: String(data.stall ?? ""),
    status: String(data.status ?? "pending"),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : "",
  };
}

export async function GET() {
  const state = await getAppSessionState();
  if (
    state.status !== "authenticated" ||
    (state.session.role !== "institutional_admin" &&
      state.session.role !== "presentation_viewer")
  ) {
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  }
  const snapshot = await getFirebaseAdminDb()
    .collection("merchantApplications")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return Response.json({
    applications: snapshot.docs.map((doc) =>
      serializeApplication(doc.id, doc.data()),
    ),
  });
}

export async function PATCH(request: Request) {
  const admin = await requireInstitutionalAdmin();
  if (!admin)
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  if (!hasTrustedSameOrigin(request)) {
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  const parsed = decisionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });

  const db = getFirebaseAdminDb();
  const auth = getFirebaseAdminAuth();
  const applicationReference = db
    .collection("merchantApplications")
    .doc(parsed.data.applicationId);
  const applicationSnapshot = await applicationReference.get();
  if (!applicationSnapshot.exists)
    return Response.json(
      { error: "Solicitud no encontrada." },
      { status: 404 },
    );
  const application = applicationSnapshot.data()!;
  const uid = String(application.userId ?? "");
  if (!uid)
    return Response.json({ error: "Solicitud incompleta." }, { status: 409 });

  if (parsed.data.decision === "rejected") {
    if (application.status === "approved")
      return Response.json(
        { error: "La solicitud ya fue aprobada." },
        { status: 409 },
      );
    const batch = db.batch();
    batch.set(
      applicationReference,
      {
        status: "rejected",
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(
      db.collection("users").doc(uid),
      { status: "rejected", updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await batch.commit();
    return Response.json({ status: "rejected" });
  }

  const businessReference = application.businessId
    ? db.collection("businesses").doc(String(application.businessId))
    : db.collection("businesses").doc();
  const businessId = businessReference.id;
  const slug = `${slugifyBusiness(String(application.businessName)) || "comercio"}-${businessId.slice(0, 6)}`;
  const authUser = await auth.getUser(uid);
  const {
    role: _role,
    businessId: _businessId,
    mustChangePassword: _mustChangePassword,
    ...otherClaims
  } = authUser.customClaims ?? {};
  void _role;
  void _businessId;
  void _mustChangePassword;
  await auth.setCustomUserClaims(uid, {
    ...otherClaims,
    role: "merchant",
    businessId,
  });

  const batch = db.batch();
  batch.set(
    businessReference,
    {
      id: businessId,
      name: String(application.businessName),
      slug,
      status: "active",
      published: false,
      description: "Información comercial pendiente de completar.",
      categoryId: String(application.categoryId),
      categoryIds: [String(application.categoryId)],
      phone: String(application.phone),
      whatsapp: String(application.whatsapp ?? application.phone),
      stall: String(application.stall ?? ""),
      createdAt: application.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    db.collection("merchants").doc(businessId),
    {
      id: businessId,
      businessId,
      slug,
      displayName: String(application.businessName),
      description: "Información comercial pendiente de completar.",
      categoryIds: [String(application.categoryId)],
      featuredProductIds: [],
      image: "/images/home/hero-market.webp",
      imageAlt: String(application.businessName),
      whatsappDemo: String(application.whatsapp ?? application.phone),
      status: "active",
      published: false,
      createdAt: application.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    db.collection("users").doc(uid),
    {
      role: "merchant",
      businessId,
      status: "approved",
      active: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  batch.set(
    applicationReference,
    {
      status: "approved",
      businessId,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: admin.uid,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();
  return Response.json({ status: "approved" });
}
