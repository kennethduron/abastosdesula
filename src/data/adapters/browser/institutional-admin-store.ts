import "client-only";

import type { BusinessStatus } from "@/domain";

const ADMIN_STATE_KEY = "abastos-demo-institutional-admin-v1";
const ADMIN_STATE_CHANGED_EVENT = "abastos-demo-institutional-admin-changed";

export interface DemoAdminActivity {
  id: string;
  description: string;
  createdAt: string;
}

export interface DemoInstitutionalAdminState {
  businessStatuses: Record<string, BusinessStatus>;
  hiddenCategoryIds: string[];
  activities: DemoAdminActivity[];
}

const emptyState: DemoInstitutionalAdminState = {
  businessStatuses: {},
  hiddenCategoryIds: [],
  activities: [],
};

export function getInstitutionalAdminSnapshot() {
  return (
    window.localStorage.getItem(ADMIN_STATE_KEY) ?? JSON.stringify(emptyState)
  );
}

export function getInstitutionalAdminServerSnapshot() {
  return JSON.stringify(emptyState);
}

export function parseInstitutionalAdminState(snapshot: string) {
  try {
    const value = JSON.parse(snapshot) as Partial<DemoInstitutionalAdminState>;
    return {
      businessStatuses: value.businessStatuses ?? {},
      hiddenCategoryIds: Array.isArray(value.hiddenCategoryIds)
        ? value.hiddenCategoryIds
        : [],
      activities: Array.isArray(value.activities) ? value.activities : [],
    } satisfies DemoInstitutionalAdminState;
  } catch {
    return emptyState;
  }
}

function saveState(state: DemoInstitutionalAdminState) {
  window.localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(ADMIN_STATE_CHANGED_EVENT));
}

export function subscribeToInstitutionalAdminState(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_STATE_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(ADMIN_STATE_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ADMIN_STATE_CHANGED_EVENT, callback);
  };
}

export function updateDemoBusinessStatus(
  businessId: string,
  businessName: string,
  status: BusinessStatus,
) {
  const state = parseInstitutionalAdminState(getInstitutionalAdminSnapshot());
  saveState({
    ...state,
    businessStatuses: { ...state.businessStatuses, [businessId]: status },
    activities: [
      {
        id: `admin-activity-${crypto.randomUUID()}`,
        description: `${businessName} cambió a estado ${status}`,
        createdAt: new Date().toISOString(),
      },
      ...state.activities,
    ].slice(0, 20),
  });
}

export function toggleDemoCategoryVisibility(
  categoryId: string,
  categoryName: string,
) {
  const state = parseInstitutionalAdminState(getInstitutionalAdminSnapshot());
  const hidden = state.hiddenCategoryIds.includes(categoryId);
  saveState({
    ...state,
    hiddenCategoryIds: hidden
      ? state.hiddenCategoryIds.filter((id) => id !== categoryId)
      : [...state.hiddenCategoryIds, categoryId],
    activities: [
      {
        id: `admin-activity-${crypto.randomUUID()}`,
        description: `${categoryName} se marcó como ${hidden ? "visible" : "oculta"} en el catálogo`,
        createdAt: new Date().toISOString(),
      },
      ...state.activities,
    ].slice(0, 20),
  });
}
