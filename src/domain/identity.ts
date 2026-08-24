import type { DemoEntity, EntityId } from "@/domain/shared";

export const USER_ROLES = [
  "merchant",
  "institutional_admin",
  "presentation_viewer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}

export interface User extends DemoEntity {
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}

export interface MerchantUser extends DemoEntity {
  userId: EntityId;
  businessId: EntityId;
  permissions: Array<
    "catalog:read" | "catalog:write" | "quotes:read" | "quotes:write"
  >;
}
