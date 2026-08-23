import type { DemoEntity, EntityId } from "@/domain/shared";

export interface Notification extends DemoEntity {
  businessId: EntityId;
  userId?: EntityId;
  title: string;
  message: string;
  read: boolean;
  entityType?: "quote_request" | "product" | "merchant";
  entityId?: EntityId;
}

export interface Activity extends DemoEntity {
  businessId?: EntityId;
  actorUserId?: EntityId;
  type: string;
  description: string;
  entityType?: string;
  entityId?: EntityId;
}

export interface Promotion extends DemoEntity {
  businessId: EntityId;
  name: string;
  description: string;
  productIds: EntityId[];
  startsAt: string;
  endsAt: string;
  active: boolean;
}
