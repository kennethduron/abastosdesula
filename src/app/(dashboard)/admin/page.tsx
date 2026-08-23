import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InstitutionalAdmin } from "@/components/admin/institutional-admin";
import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin";
import { getVerifiedAppSession } from "@/data/adapters/firebase/session";
import {
  demoBusinesses,
  demoCategories,
  demoMerchants,
  demoProducts,
} from "@/data/adapters/mock/demo-data";

export const metadata: Metadata = {
  title: "Administración demo | Central de Abastos de Sula",
  description: "Vista institucional demostrativa de actividad agregada.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InstitutionalAdminPage() {
  const businesses = demoBusinesses.map((business) => {
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

  if (isFirebaseAdminConfigured()) {
    const session = await getVerifiedAppSession();
    if (!session) redirect("/acceso?next=/admin");
    if (session.role !== "institutional_admin") redirect("/panel");
    return (
      <InstitutionalAdmin
        businesses={businesses}
        categories={categories}
        firebaseAuthenticated
      />
    );
  }

  return <InstitutionalAdmin businesses={businesses} categories={categories} />;
}
