import type { DemoEntity, EntityId } from "@/domain/shared";

export type BusinessStatus = "active" | "inactive" | "pending";

export interface Business extends DemoEntity {
  name: string;
  slug: string;
  status: BusinessStatus;
}

export interface Merchant extends DemoEntity {
  businessId: EntityId;
  slug: string;
  displayName: string;
  description: string;
  categoryIds: EntityId[];
  featuredProductIds: EntityId[];
  image: string;
  imageAlt: string;
  whatsappDemo?: string;
  verificationLabel: "demo";
  status: BusinessStatus;
}
