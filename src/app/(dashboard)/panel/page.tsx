import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MerchantDashboard } from "@/components/dashboard/merchant-dashboard";
import {
  isFirebaseAdminConfigured,
  isLocalFirebaseFallbackAllowed,
} from "@/data/adapters/firebase/admin-config";
import { getAppSessionState } from "@/data/adapters/firebase/session";
import { demoBusinesses, demoProducts } from "@/data/adapters/mock/demo-data";

export const metadata: Metadata = {
  title: "Panel del comerciante | Central de Abastos de Sula",
  description:
    "Gestiona solicitudes, clientes y actividad comercial desde un solo lugar.",
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
      redirect(`/acceso?next=/panel${reason}`);
    }
    const session = sessionState.session;
    if (session.role === "merchant_applicant") redirect("/solicitud-recibida");
    if (session.role !== "merchant") redirect("/admin");
    if (session.mustChangePassword) redirect("/cambiar-contrasena");
    let business = businesses.find((item) => item.id === session.businessId);
    if (!business && session.businessId) {
      const { getFirebaseAdminDb } =
        await import("@/data/adapters/firebase/admin");
      const snapshot = await getFirebaseAdminDb()
        .collection("businesses")
        .doc(session.businessId)
        .get();
      const data = snapshot.data();
      if (snapshot.exists && data?.status === "active") {
        business = {
          id: snapshot.id,
          name: String(data.name ?? "Mi negocio"),
          productCount: 0,
        };
      }
    }
    if (!business) redirect("/acceso?error=business");
    const dashboardBusinesses = businesses.some(
      (item) => item.id === business.id,
    )
      ? businesses
      : [...businesses, business];
    return (
      <MerchantDashboard
        businesses={dashboardBusinesses}
        products={demoProducts.map((product) => ({
          id: product.id,
          businessId: product.businessId,
          name: product.name,
          unit: product.unit,
          image: product.image,
          imageAlt: product.imageAlt,
          referencePriceMinor: product.referencePrice.amountMinor,
        }))}
        firebaseSession={{
          role: "merchant",
          businessId: business.id,
          businessName: business.name,
        }}
      />
    );
  }

  return (
    <MerchantDashboard
      businesses={businesses}
      products={demoProducts.map((product) => ({
        id: product.id,
        businessId: product.businessId,
        name: product.name,
        unit: product.unit,
        image: product.image,
        imageAlt: product.imageAlt,
        referencePriceMinor: product.referencePrice.amountMinor,
      }))}
    />
  );
}
