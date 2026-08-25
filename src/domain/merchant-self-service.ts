import { z } from "zod";

export const merchantApplicationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);
export type MerchantApplicationStatus = z.infer<
  typeof merchantApplicationStatusSchema
>;

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Ingresa un teléfono válido.")
  .max(24)
  .regex(/^[+\d][\d\s()-]+$/, "Ingresa un teléfono válido.");

const passwordSchema = z
  .string()
  .min(10, "Usa al menos 10 caracteres.")
  .max(128)
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "Incluye al menos una letra.")
  .regex(/\d/, "Incluye al menos un número.");

export const merchantApplicationSchema = z
  .object({
    responsibleName: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase().max(254),
    phone: phoneSchema,
    whatsapp: phoneSchema,
    businessName: z.string().trim().min(2).max(120),
    categoryId: z.string().trim().min(2).max(80),
    stall: z.string().trim().max(80),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedTerms: z.boolean().refine((accepted) => accepted, {
      message: "Debes aceptar las condiciones para continuar.",
    }),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });
export type MerchantApplicationInput = z.infer<
  typeof merchantApplicationSchema
>;

export const directMerchantSchema = z
  .object({
    responsibleName: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase().max(254),
    phone: phoneSchema,
    whatsapp: phoneSchema.optional(),
    businessName: z.string().trim().min(2).max(120),
    categoryId: z.string().trim().min(2).max(80),
    stall: z.string().trim().max(80),
    initialStatus: z.enum(["active", "inactive"]).default("active"),
  })
  .strict();

export const businessProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(800),
    categoryId: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    whatsapp: phoneSchema,
    hours: z.string().trim().max(160),
    stall: z.string().trim().max(80),
    logo: z.union([z.url(), z.literal("")]),
    coverImage: z.union([z.url(), z.literal("")]),
    published: z.boolean(),
  })
  .strict();
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const merchantProductSchema = z
  .object({
    name: z.string().trim().min(2).max(140),
    description: z.string().trim().min(5).max(1000),
    categoryId: z.string().trim().min(2).max(80),
    image: z.union([z.url(), z.string().startsWith("/images/")]),
    priceMinor: z.number().int().min(0).max(100_000_000),
    unit: z.string().trim().min(1).max(40),
    sku: z.string().trim().max(80),
    stock: z.number().int().min(0).max(10_000_000),
    minimumStock: z.number().int().min(0).max(10_000_000),
    published: z.boolean(),
    status: z.enum(["active", "inactive"]),
  })
  .strict();
export type MerchantProductInput = z.infer<typeof merchantProductSchema>;

export const inventoryMovementSchema = z
  .object({
    productId: z.string().min(1).max(160),
    type: z.enum(["entry", "exit", "adjustment"]),
    quantity: z.number().int().min(0).max(10_000_000),
    reason: z.string().trim().min(2).max(240),
  })
  .strict();

export const changePasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });
