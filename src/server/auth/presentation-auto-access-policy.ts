import { isUserRole, type UserRole } from "@/domain";

export type PresentationAutoAccessDecision =
  | { action: "deny"; reason: "disabled" | "inactive" | "role-conflict" }
  | { action: "refresh"; role: UserRole }
  | { action: "provision"; role: "presentation_viewer" };

export function isPresentationAutoAccessEnabled(value: string | undefined) {
  return value === "true";
}

export function decidePresentationAutoAccess({
  enabled,
  authDisabled,
  authRole,
  profileActive,
  profileRole,
}: {
  enabled: boolean;
  authDisabled: boolean;
  authRole: unknown;
  profileActive: unknown;
  profileRole: unknown;
}): PresentationAutoAccessDecision {
  if (!enabled) return { action: "deny", reason: "disabled" };
  if (authDisabled || profileActive === false) {
    return { action: "deny", reason: "inactive" };
  }

  if (isUserRole(authRole) && authRole !== "presentation_viewer") {
    return { action: "refresh", role: authRole };
  }
  if (isUserRole(profileRole) && profileRole !== "presentation_viewer") {
    return { action: "deny", reason: "role-conflict" };
  }
  if (authRole === "presentation_viewer") {
    return { action: "refresh", role: "presentation_viewer" };
  }
  return { action: "provision", role: "presentation_viewer" };
}
