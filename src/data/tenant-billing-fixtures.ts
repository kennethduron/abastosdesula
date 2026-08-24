import type { TenantAccount, TenantPayment } from "@/domain";

const createdAt = "2026-08-24T12:00:00.000Z";

export const tenantAccountFixtures: TenantAccount[] = [
  {
    id: "business-frutas-valle",
    businessId: "business-frutas-valle",
    businessName: "Comercial Frutas del Valle",
    responsibleName: "María Fernanda López",
    stallLabel: "Local A-12",
    categoryName: "Frutas y verduras",
    leaseStatus: "active",
    nextDueDate: "2026-09-05T06:00:00.000-06:00",
    monthlyAmountMinor: 850000,
    outstandingBalanceMinor: 0,
    accountStatus: "current",
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "business-la-huerta",
    businessId: "business-la-huerta",
    businessName: "Verduras La Huerta",
    responsibleName: "Carlos Humberto Mejía",
    stallLabel: "Puesto B-07",
    categoryName: "Verduras",
    leaseStatus: "active",
    nextDueDate: "2026-09-05T06:00:00.000-06:00",
    monthlyAmountMinor: 720000,
    outstandingBalanceMinor: 720000,
    accountStatus: "pending",
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "business-granos-sula",
    businessId: "business-granos-sula",
    businessName: "Granos y Más Sula",
    responsibleName: "Elena Patricia Rivera",
    stallLabel: "Local C-03",
    categoryName: "Granos y abarrotes",
    leaseStatus: "active",
    nextDueDate: "2026-08-05T06:00:00.000-06:00",
    monthlyAmountMinor: 650000,
    outstandingBalanceMinor: 650000,
    accountStatus: "overdue",
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "business-lacteos-esperanza",
    businessId: "business-lacteos-esperanza",
    businessName: "Lácteos La Esperanza",
    responsibleName: "José Antonio Cruz",
    stallLabel: "Puesto D-09",
    categoryName: "Lácteos",
    leaseStatus: "active",
    nextDueDate: "2026-09-10T06:00:00.000-06:00",
    monthlyAmountMinor: 780000,
    outstandingBalanceMinor: 0,
    accountStatus: "current",
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "business-abarrotes-norte",
    businessId: "business-abarrotes-norte",
    businessName: "Abarrotes del Norte",
    responsibleName: "Sandra Milagro Pineda",
    stallLabel: "Local E-04",
    categoryName: "Abarrotes",
    leaseStatus: "active",
    nextDueDate: "2026-09-08T06:00:00.000-06:00",
    monthlyAmountMinor: 810000,
    outstandingBalanceMinor: 405000,
    accountStatus: "pending",
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "business-cosecha-fresca",
    businessId: "business-cosecha-fresca",
    businessName: "Cosecha Fresca Sula",
    responsibleName: "Luis Fernando Aguilar",
    stallLabel: "Puesto F-02",
    categoryName: "Frutas y verduras",
    leaseStatus: "active",
    nextDueDate: "2026-09-05T06:00:00.000-06:00",
    monthlyAmountMinor: 690000,
    outstandingBalanceMinor: 0,
    accountStatus: "current",
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  },
];

export const tenantPaymentFixtures: TenantPayment[] =
  tenantAccountFixtures.flatMap((account, index) => {
    const augustStatus =
      account.accountStatus === "overdue"
        ? "overdue"
        : account.accountStatus === "pending"
          ? account.outstandingBalanceMinor < account.monthlyAmountMinor
            ? "partial"
            : "pending"
          : "paid";
    const paidAmount =
      augustStatus === "paid"
        ? account.monthlyAmountMinor
        : augustStatus === "partial"
          ? account.monthlyAmountMinor - account.outstandingBalanceMinor
          : 0;
    return [
      {
        id: `payment-${account.businessId}-2026-08`,
        businessId: account.businessId,
        period: "Agosto 2026",
        dueDate: "2026-08-05T06:00:00.000-06:00",
        concept: "Mensualidad del local",
        amountMinor: account.monthlyAmountMinor,
        paidAmountMinor: paidAmount,
        status: augustStatus,
        ...(augustStatus === "paid" || augustStatus === "partial"
          ? {
              paidAt: `2026-08-0${Math.min(index + 2, 8)}T10:30:00.000-06:00`,
              reference: `REC-2026-08-${String(index + 1).padStart(3, "0")}`,
            }
          : {}),
        isDemo: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: `payment-${account.businessId}-2026-07`,
        businessId: account.businessId,
        period: "Julio 2026",
        dueDate: "2026-07-05T06:00:00.000-06:00",
        concept: "Mensualidad del local",
        amountMinor: account.monthlyAmountMinor,
        paidAmountMinor: account.monthlyAmountMinor,
        status: "paid",
        paidAt: `2026-07-0${Math.min(index + 2, 8)}T09:15:00.000-06:00`,
        reference: `REC-2026-07-${String(index + 1).padStart(3, "0")}`,
        isDemo: true,
        createdAt,
        updatedAt: createdAt,
      },
    ] satisfies TenantPayment[];
  });
