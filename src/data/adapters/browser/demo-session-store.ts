import "client-only";

const SESSION_KEY = "abastos-demo-merchant-session-v1";
const SESSION_CHANGED_EVENT = "abastos-demo-session-changed";

export interface DemoMerchantSession {
  role: "merchant";
  businessId: string;
  businessName: string;
}

export interface DemoInstitutionalSession {
  role: "institutional_admin";
}

export type DemoSession = DemoMerchantSession | DemoInstitutionalSession;

export function getDemoSessionSnapshot() {
  return window.localStorage.getItem(SESSION_KEY) ?? "";
}

export function getDemoSessionServerSnapshot() {
  return "";
}

export function parseDemoSession(snapshot: string) {
  try {
    const value = JSON.parse(snapshot) as Partial<DemoSession>;
    if (value.role === "institutional_admin") {
      return value as DemoInstitutionalSession;
    }
    return value.role === "merchant" &&
      typeof value.businessId === "string" &&
      typeof value.businessName === "string"
      ? (value as DemoMerchantSession)
      : null;
  } catch {
    return null;
  }
}

export function setDemoSession(session: DemoSession | null) {
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function subscribeToDemoSession(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_CHANGED_EVENT, callback);
  };
}
