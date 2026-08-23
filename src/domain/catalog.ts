import type { DemoEntity, EntityId, Money } from "@/domain/shared";

export interface Category extends DemoEntity {
  name: string;
  slug: string;
  description: string;
  image: string;
  imageAlt: string;
}

export type ProductAvailability = "available" | "limited" | "unavailable";

export interface Product extends DemoEntity {
  businessId: EntityId;
  categoryId: EntityId;
  name: string;
  slug: string;
  description: string;
  image: string;
  imageAlt: string;
  unit: string;
  referencePrice: Money;
  availability: ProductAvailability;
  featured: boolean;
}

export interface ProductQuery {
  businessId?: EntityId;
  categoryId?: EntityId;
  search?: string;
  availability?: ProductAvailability;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}
