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

export type QuoteRequestSource =
  "platform" | "whatsapp" | "phone" | "in_person" | "other";

export interface QuoteRequestItem {
  productId: EntityId;
  productName: string;
  quantity: number;
  unit: string;
  image?: string;
  imageAlt?: string;
  referencePriceMinor?: number;
}

export interface QuoteLine {
  productId: EntityId;
  productName: string;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  subtotalMinor: number;
}

export interface QuoteCommercialProposal {
  lines: QuoteLine[];
  discountMinor: number;
  note?: string;
  totalMinor: number;
  updatedAt: IsoDateTime;
  version: number;
}

export interface InternalNote {
  id: EntityId;
  body: string;
  createdAt: IsoDateTime;
}

export interface FollowUp {
  id: EntityId;
  title: string;
  dueAt: IsoDateTime;
  note?: string;
  status: "pending" | "completed";
  completedAt?: IsoDateTime;
}

export type CrmActivityType =
  | "request_created"
  | "status_changed"
  | "quotation_updated"
  | "note_added"
  | "follow_up_created"
  | "follow_up_completed";

export interface CrmActivityEvent {
  id: EntityId;
  type: CrmActivityType;
  description: string;
  createdAt: IsoDateTime;
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
  company?: string;
  customerType: CustomerType;
  phone: string;
  whatsapp?: string;
  source?: QuoteRequestSource;
  fulfillment: "pickup" | "delivery" | "coordinate";
  notes?: string;
  items: QuoteRequestItem[];
  status: QuoteRequestStatus;
  history: QuoteStatusEvent[];
  internalNotes?: InternalNote[];
  followUps?: FollowUp[];
  quotation?: QuoteCommercialProposal;
  activity?: CrmActivityEvent[];
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

const quoteSourceSchema = z.enum([
  "platform",
  "whatsapp",
  "phone",
  "in_person",
  "other",
]);

export const publicQuoteRequestSchema = z
  .object({
    businessId: z.string().min(1).max(120),
    customerName: z.string().trim().min(2).max(120),
    company: z.string().trim().max(160).optional(),
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

export const manualQuoteRequestSchema = z
  .object({
    businessId: z.string().min(1).max(120),
    customerId: z.string().min(1).max(120).optional(),
    customerName: z.string().trim().min(2).max(120),
    company: z.string().trim().max(160).optional(),
    customerType: z.enum([
      "person",
      "restaurant",
      "supermarket",
      "business",
      "other",
    ]),
    phone: z.string().trim().min(8).max(24),
    whatsapp: z.string().trim().min(8).max(24).optional(),
    source: quoteSourceSchema,
    fulfillment: z.enum(["pickup", "delivery", "coordinate"]),
    notes: z.string().trim().max(1_000).optional(),
    status: z.enum([
      "new",
      "in_review",
      "quoted",
      "confirmed",
      "preparing",
      "completed",
      "cancelled",
    ]),
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(120),
            productName: z.string().trim().min(1).max(160),
            quantity: z.number().positive().max(10_000),
            unit: z.string().trim().min(1).max(40),
            referencePriceMinor: z
              .number()
              .int()
              .nonnegative()
              .max(100_000_000),
            image: z.string().max(500).optional(),
            imageAlt: z.string().max(240).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

export type ManualQuoteRequestInput = z.infer<typeof manualQuoteRequestSchema>;

export const quotationSchema = z
  .object({
    lines: z
      .array(
        z
          .object({
            productId: z.string().min(1).max(120),
            productName: z.string().trim().min(1).max(160),
            quantity: z.number().positive().max(10_000),
            unit: z.string().trim().min(1).max(40),
            unitPriceMinor: z.number().int().nonnegative().max(100_000_000),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    discountMinor: z.number().int().nonnegative().max(100_000_000),
    note: z.string().trim().max(1_000).optional(),
  })
  .strict();

export const internalNoteSchema = z.string().trim().min(2).max(1_000);

export const followUpSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    dueAt: z.string().datetime(),
    note: z.string().trim().max(1_000).optional(),
  })
  .strict();
