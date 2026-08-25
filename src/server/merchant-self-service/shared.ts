import "server-only";

import { getAppSessionState } from "@/data/adapters/firebase/session";

export function slugifyBusiness(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export async function requireInstitutionalAdmin() {
  const state = await getAppSessionState();
  return state.status === "authenticated" &&
    state.session.role === "institutional_admin"
    ? state.session
    : null;
}

export function requestClientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
