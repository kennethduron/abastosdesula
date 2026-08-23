import { z } from "zod";

import type { CustomerType } from "@/domain/customers";
import type { DemoEntity, EntityId, IsoDateTime } from "@/domain/shared";

export type QuoteRequestStatus =
  | "new"
  | "in_review"
  | "quoted"
  | "confirmed"
  | "preparing"
  | "completed"
  | "cancelled";

export interface QuoteRequestItem {
  productId: EntityId;
  productName: string;
  quantity: number;
  unit: string;
}

export interface QuoteStatusEvent {
  status: QuoteRequestStatus;
  changedAt: IsoDateTime;
  changedByUserId?: EntityId;
  note?: string;
}

export interface QuoteRequest extends DemoEntity {
  businessId: EntityId;
  customerId: EntityId;
  customerName: string;
  customerType: CustomerType;
  phone: string;
  whatsapp?: string;
  fulfillment: "pickup" | "delivery" | "coordinate";
  notes?: string;
  items: QuoteRequestItem[];
  status: QuoteRequestStatus;
  history: QuoteStatusEvent[];
}

export interface CartItem {
  productId: EntityId;
  businessId: EntityId;
  businessName: string;
  whatsappDemo: string;
  productName: string;
  image: string;
  imageAlt: string;
  priceMinor: number;
  unit: string;
  quantity: number;
}

export interface Cart {
  businessId: EntityId | null;
  items: CartItem[];
  updatedAt: IsoDateTime;
}

export type AddCartItemResult =
  | { outcome: "added"; cart: Cart }
  | {
      outcome: "business_conflict";
      cart: Cart;
      currentBusinessId: EntityId;
      requestedBusinessId: EntityId;
    };

export function addItemToCart(cart: Cart, item: CartItem): AddCartItemResult {
  if (cart.businessId && cart.businessId !== item.businessId) {
    return {
      outcome: "business_conflict",
      cart,
      currentBusinessId: cart.businessId,
      requestedBusinessId: item.businessId,
    };
  }

  const existing = cart.items.find(
    (cartItem) => cartItem.productId === item.productId,
  );
  const items = existing
    ? cart.items.map((cartItem) =>
        cartItem.productId === item.productId
          ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
          : cartItem,
      )
    : [...cart.items, item];

  return {
    outcome: "added",
    cart: {
      businessId: item.businessId,
      items,
      updatedAt: new Date().toISOString(),
    },
  };
}

const quoteItemSchema = z
  .object({
    productId: z.string().min(1).max(120),
    quantity: z.number().positive().max(10_000),
    unit: z.string().min(1).max(40),
  })
  .strict();

export const publicQuoteRequestSchema = z
  .object({
    businessId: z.string().min(1).max(120),
    customerName: z.string().trim().min(2).max(120),
    customerType: z.enum([
      "person",
      "restaurant",
      "supermarket",
      "business",
      "other",
    ]),
    phone: z.string().trim().min(8).max(24),
    whatsapp: z.string().trim().min(8).max(24).optional(),
    fulfillment: z.enum(["pickup", "delivery", "coordinate"]),
    notes: z.string().trim().max(1_000).optional(),
    items: z.array(quoteItemSchema).min(1).max(50),
  })
  .strict();

export type PublicQuoteRequestInput = z.infer<typeof publicQuoteRequestSchema>;
