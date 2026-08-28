import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LeasingAdminWorkspace } from "@/components/admin/leasing-admin-workspace";
import {
  isFirebaseAdminConfigured,
  isLocalFirebaseFallbackAllowed,
} from "@/data/adapters/firebase/admin-config";
import { getAppSessionState } from "@/data/adapters/firebase/session";
import { getLeasingAdminData } from "@/data/leasing-admin";
import type { UserRole } from "@/domain";

export const metadata: Metadata = {
  title: "Solicitudes de locales | Central de Abastos de Sula",
  description: "CRM institucional de arrendamientos.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function LeasingAdminPage() {
  const localFallback = isLocalFirebaseFallbackAllowed();
  let role: Extract<UserRole, "institutional_admin" | "presentation_viewer"> =
    "institutional_admin";
  if (
    !localFallback &&
    (process.env.NODE_ENV === "production" || isFirebaseAdminConfigured())
  ) {
    const state = await getAppSessionState();
    if (state.status !== "authenticated")
      redirect("/acceso?next=/admin/locales");
    if (
      state.session.role !== "institutional_admin" &&
      state.session.role !== "presentation_viewer"
    )
      redirect("/panel");
    role = state.session.role;
  }
  const data = await getLeasingAdminData(role === "institutional_admin");
  return (
    <LeasingAdminWorkspace
      {...data}
      role={role}
      localFallback={localFallback}
    />
  );
}
