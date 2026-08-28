import { describe, expect, it } from "vitest";

import { publicLeasingInquirySchema } from "@/domain/commercial-spaces";

const valid = {
  commercialSpaceId: "space-wide-retail",
  fullName: "María Hernández",
  phone: "+504 9999-0000",
  whatsapp: "",
  email: "maria@example.com",
  company: "Comercial Hernández",
  businessType: "Distribución de alimentos",
  intendedUse: "Distribución y almacenamiento de alimentos empacados.",
  requestedStartDate: "2026-10-01",
  comments: "Necesito conocer las condiciones.",
  contactPreference: "whatsapp",
  website: "",
};

describe("publicLeasingInquirySchema", () => {
  it("accepts the required commercial inquiry fields", () => {
    expect(publicLeasingInquirySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects bot honeypots and malformed contact data", () => {
    expect(
      publicLeasingInquirySchema.safeParse({
        ...valid,
        website: "spam.example",
      }).success,
    ).toBe(false);
    expect(
      publicLeasingInquirySchema.safeParse({ ...valid, phone: "abc" }).success,
    ).toBe(false);
  });
});
