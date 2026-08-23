import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MerchantDashboard } from "@/components/dashboard/merchant-dashboard";
import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin";
import { getVerifiedAppSession } from "@/data/adapters/firebase/session";
import { demoBusinesses, demoProducts } from "@/data/adapters/mock/demo-data";

export const metadata: Metadata = {
  title: "Panel demo del comerciante | Central de Abastos de Sula",
  description:
    "Panel demostrativo para gestionar solicitudes y clientes de un comerciante.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MerchantPanelPage() {
  const businesses = demoBusinesses.map((business) => ({
    id: business.id,
    name: business.name,
    productCount: demoProducts.filter(
      (product) => product.businessId === business.id,
    ).length,
  }));

  if (isFirebaseAdminConfigured()) {
    const session = await getVerifiedAppSession();
    if (!session) redirect("/acceso?next=/panel");
    if (session.role === "institutional_admin") redirect("/admin");
    const business = businesses.find((item) => item.id === session.businessId);
    if (!business) redirect("/acceso?error=business");
    return (
      <MerchantDashboard
        businesses={businesses}
        firebaseSession={{
          role: "merchant",
          businessId: business.id,
          businessName: business.name,
        }}
      />
    );
  }

  return <MerchantDashboard businesses={businesses} />;
}
