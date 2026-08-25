import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "@/data/adapters/firebase/admin";
import { directMerchantSchema } from "@/domain";
import {
  requireInstitutionalAdmin,
  slugifyBusiness,
} from "@/server/merchant-self-service/shared";
import { hasTrustedSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireInstitutionalAdmin();
  if (!admin)
    return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  if (!hasTrustedSameOrigin(request))
    return Response.json({ error: "Origen no autorizado." }, { status: 403 });
  const parsed = directMerchantSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Revisa la información ingresada." },
      { status: 400 },
    );

  const input = parsed.data;
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  const businessReference = db.collection("businesses").doc();
  const businessId = businessReference.id;
  const slug = `${slugifyBusiness(input.businessName) || "comercio"}-${businessId.slice(0, 6)}`;
  const temporaryPassword = `Ca7!${randomBytes(12).toString("base64url")}`;
  let uid: string | null = null;
  try {
    const authUser = await auth.createUser({
      email: input.email,
      password: temporaryPassword,
      displayName: input.responsibleName,
    });
    uid = authUser.uid;
    await auth.setCustomUserClaims(uid, {
      role: "merchant",
      businessId,
      mustChangePassword: true,
    });
    const batch = db.batch();
    batch.create(businessReference, {
      id: businessId,
      name: input.businessName,
      slug,
      status: input.initialStatus,
      published: false,
      description: "Información comercial pendiente de completar.",
      categoryId: input.categoryId,
      categoryIds: [input.categoryId],
      phone: input.phone,
      whatsapp: input.whatsapp ?? input.phone,
      stall: input.stall,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(db.collection("merchants").doc(businessId), {
      id: businessId,
      businessId,
      slug,
      displayName: input.businessName,
      description: "Información comercial pendiente de completar.",
      categoryIds: [input.categoryId],
      featuredProductIds: [],
      image: "/images/home/hero-market.webp",
      imageAlt: input.businessName,
      whatsappDemo: input.whatsapp ?? input.phone,
      status: input.initialStatus,
      published: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(db.collection("users").doc(uid), {
      uid,
      email: input.email,
      displayName: input.responsibleName,
      role: "merchant",
      businessId,
      status: "approved",
      active: input.initialStatus === "active",
      mustChangePassword: true,
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return Response.json({ created: true, temporaryPassword }, { status: 201 });
  } catch (error) {
    if (uid) await auth.deleteUser(uid).catch(() => undefined);
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "unknown";
    if (code === "auth/email-already-exists")
      return Response.json(
        { error: "Ya existe una cuenta con este correo." },
        { status: 409 },
      );
    console.error("[admin-merchant] creation failed", { code });
    return Response.json(
      { error: "No fue posible crear el acceso." },
      { status: 503 },
    );
  }
}
