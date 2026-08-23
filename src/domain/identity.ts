import type { DemoEntity, EntityId } from "@/domain/shared";

export type UserRole = "merchant" | "institutional_admin";

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
