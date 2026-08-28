import { z } from "zod";

export const COMMERCIAL_SPACE_STATUSES = [
  "available",
  "reserved",
  "unavailable",
] as const;
export type CommercialSpaceStatus = (typeof COMMERCIAL_SPACE_STATUSES)[number];

export const LEASING_INQUIRY_STATUSES = [
  "new",
  "contacted",
  "visit_scheduled",
  "proposal_sent",
  "negotiating",
  "approved",
  "closed",
  "not_interested",
] as const;
export type LeasingInquiryStatus = (typeof LEASING_INQUIRY_STATUSES)[number];

export interface CommercialSpaceImage {
  src: string;
  alt: string;
}

export interface CommercialSpace {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  type: string;
  locationLabel: string;
  approximateArea: string;
  availabilityStatus: CommercialSpaceStatus;
  rentalPrice?: number;
  priceVisibility: "visible" | "consult" | "request_information";
  features: string[];
  suitableFor: string[];
  images: CommercialSpaceImage[];
  coverImage: CommercialSpaceImage;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeasingNote {
  id: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface LeasingActivity {
  id: string;
  inquiryId: string;
  type: "created" | "status_changed" | "note_added" | "follow_up_scheduled";
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface LeasingInquiry {
  id: string;
  reference: string;
  commercialSpaceId: string;
  commercialSpaceTitle: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  company?: string;
  businessType: string;
  intendedUse: string;
  requestedStartDate?: string;
  notes?: string;
  contactPreference: "phone" | "whatsapp" | "email";
  status: LeasingInquiryStatus;
  internalNotes: LeasingNote[];
  activity: LeasingActivity[];
  nextAction?: string;
  followUpAt?: string;
  assignedTo?: string;
  source: "public_spaces";
  createdAt: string;
  updatedAt: string;
}

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const publicLeasingInquirySchema = z
  .object({
    commercialSpaceId: z.string().trim().min(1).max(100),
    fullName: z.string().trim().min(3).max(120),
    phone: z
      .string()
      .trim()
      .min(8)
      .max(24)
      .regex(/^[+\d][\d\s()-]+$/),
    whatsapp: optionalText(24),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    company: optionalText(120),
    businessType: z.string().trim().min(2).max(100),
    intendedUse: z.string().trim().min(10).max(800),
    requestedStartDate: optionalText(40),
    comments: optionalText(1200),
    contactPreference: z.enum(["phone", "whatsapp", "email"]),
    website: z.string().max(0),
  })
  .strict();

export type PublicLeasingInquiryInput = z.infer<
  typeof publicLeasingInquirySchema
>;

export const leasingInquiryUpdateSchema = z
  .object({
    inquiryId: z.string().trim().min(1).max(160),
    status: z.enum(LEASING_INQUIRY_STATUSES).optional(),
    note: optionalText(1000),
    nextAction: optionalText(240),
    followUpAt: optionalText(60),
  })
  .strict()
  .refine(
    (value) =>
      value.status || value.note || value.nextAction || value.followUpAt,
    "No hay cambios para guardar.",
  );

export const commercialSpaceAdminSchema = z
  .object({
    id: z.string().trim().max(160).optional(),
    title: z.string().trim().min(4).max(120),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[a-z0-9-]+$/),
    shortDescription: z.string().trim().min(10).max(220),
    description: z.string().trim().min(20).max(1800),
    type: z.string().trim().min(2).max(80),
    locationLabel: z.string().trim().min(2).max(120),
    approximateArea: z.string().trim().min(2).max(60),
    availabilityStatus: z.enum(COMMERCIAL_SPACE_STATUSES),
    priceVisibility: z.enum(["visible", "consult", "request_information"]),
    rentalPrice: z.number().nonnegative().optional(),
    features: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
    suitableFor: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
    coverImageSrc: z.string().trim().startsWith("/images/spaces/").max(240),
    published: z.boolean(),
    featured: z.boolean(),
  })
  .strict();

export const LEASING_STATUS_LABELS: Record<LeasingInquiryStatus, string> = {
  new: "Nueva",
  contacted: "Contactado",
  visit_scheduled: "Visita programada",
  proposal_sent: "Propuesta enviada",
  negotiating: "En negociación",
  approved: "Aprobada",
  closed: "Cerrada",
  not_interested: "No interesado",
};
