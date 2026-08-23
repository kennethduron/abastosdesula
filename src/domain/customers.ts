import type { DemoEntity, EntityId } from "@/domain/shared";

export type CustomerType =
  "person" | "restaurant" | "supermarket" | "business" | "other";

export interface Customer extends DemoEntity {
  businessId: EntityId;
  name: string;
  type: CustomerType;
  phone: string;
  whatsapp?: string;
  notes?: string;
}
