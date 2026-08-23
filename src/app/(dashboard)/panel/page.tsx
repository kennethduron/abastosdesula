import type { Metadata } from "next";

import { MerchantDashboard } from "@/components/dashboard/merchant-dashboard";
import { demoBusinesses, demoProducts } from "@/data/adapters/mock/demo-data";

export const metadata: Metadata = {
  title: "Panel demo del comerciante | Central de Abastos de Sula",
  description:
    "Panel demostrativo para gestionar solicitudes y clientes de un comerciante.",
  robots: { index: false, follow: false },
};

export default function MerchantPanelPage() {
  const businesses = demoBusinesses.map((business) => ({
    id: business.id,
    name: business.name,
    productCount: demoProducts.filter(
      (product) => product.businessId === business.id,
    ).length,
  }));

  return <MerchantDashboard businesses={businesses} />;
}
