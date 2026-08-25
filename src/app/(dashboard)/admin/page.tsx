import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InstitutionalAdmin } from "@/components/admin/institutional-admin";
import {
  isFirebaseAdminConfigured,
  isLocalFirebaseFallbackAllowed,
} from "@/data/adapters/firebase/admin-config";
import { getAppSessionState } from "@/data/adapters/firebase/session";
import {
  demoBusinesses,
  demoCategories,
  demoMerchants,
  demoProducts,
} from "@/data/adapters/mock/demo-data";

export const metadata: Metadata = {
  title: "Administración institucional | Central de Abastos de Sula",
  description: "Vista institucional de actividad y gestión operativa.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InstitutionalAdminPage() {
  let businesses = demoBusinesses.map((business) => {
    const merchant = demoMerchants.find(
      (item) => item.businessId === business.id,
    );
    return {
      id: business.id,
      name: business.name,
      status: business.status,
      productCount: demoProducts.filter(
        (product) => product.businessId === business.id,
      ).length,
      categoryCount: merchant?.categoryIds.length ?? 0,
    };
  });
  const categories = demoCategories.map((category) => ({
    id: category.id,
    name: category.name,
    productCount: demoProducts.filter(
      (product) => product.categoryId === category.id,
    ).length,
    merchantCount: demoMerchants.filter((merchant) =>
      merchant.categoryIds.includes(category.id),
    ).length,
  }));

  if (
    !isLocalFirebaseFallbackAllowed() &&
    (process.env.NODE_ENV === "production" || isFirebaseAdminConfigured())
  ) {
    const sessionState = await getAppSessionState();
    if (sessionState.status !== "authenticated") {
      const reason =
        sessionState.status === "invalid"
          ? "&error=session&clearSession=1"
          : sessionState.status === "unavailable"
            ? "&error=service"
            : "";
      redirect(`/acceso?next=/admin${reason}`);
    }
    const session = sessionState.session;
    if (session.role === "merchant_applicant") redirect("/solicitud-recibida");
    if (
      session.role !== "institutional_admin" &&
      session.role !== "presentation_viewer"
    )
      redirect("/panel");
    const { getFirebaseAdminDb } =
      await import("@/data/adapters/firebase/admin");
    const db = getFirebaseAdminDb();
    const [businessSnapshot, productSnapshot, merchantSnapshot] =
      await Promise.all([
        db.collection("businesses").limit(250).get(),
        db.collection("products").limit(500).get(),
        db.collection("merchants").limit(250).get(),
      ]);
    const businessById = new Map(
      businesses.map((business) => [business.id, business]),
    );
    for (const document of businessSnapshot.docs) {
      const data = document.data();
      const merchant = merchantSnapshot.docs.find(
        (item) => item.data().businessId === document.id,
      );
      businessById.set(document.id, {
        id: document.id,
        name: String(data.name ?? "Comercio"),
        status:
          data.status === "inactive" || data.status === "pending"
            ? data.status
            : "active",
        productCount: productSnapshot.docs.filter(
          (item) => item.data().businessId === document.id,
        ).length,
        categoryCount: Array.isArray(merchant?.data().categoryIds)
          ? merchant.data().categoryIds.length
          : 0,
      });
    }
    businesses = [...businessById.values()];
    return (
      <InstitutionalAdmin
        businesses={businesses}
        categories={categories}
        firebaseAuthenticated
        firebaseRole={session.role}
      />
    );
  }

  return <InstitutionalAdmin businesses={businesses} categories={categories} />;
}
