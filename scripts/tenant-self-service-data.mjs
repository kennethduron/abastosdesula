const createdAt = "2026-08-24T12:00:00.000Z";

const accountSeeds = [
  [
    "business-frutas-valle",
    "Comercial Frutas del Valle",
    "María Fernanda López",
    "Local A-12",
    "Frutas y verduras",
    "2026-09-05T06:00:00.000-06:00",
    850000,
    0,
    "current",
  ],
  [
    "business-la-huerta",
    "Verduras La Huerta",
    "Carlos Humberto Mejía",
    "Puesto B-07",
    "Verduras",
    "2026-09-05T06:00:00.000-06:00",
    720000,
    720000,
    "pending",
  ],
  [
    "business-granos-sula",
    "Granos y Más Sula",
    "Elena Patricia Rivera",
    "Local C-03",
    "Granos y abarrotes",
    "2026-08-05T06:00:00.000-06:00",
    650000,
    650000,
    "overdue",
  ],
  [
    "business-lacteos-esperanza",
    "Lácteos La Esperanza",
    "José Antonio Cruz",
    "Puesto D-09",
    "Lácteos",
    "2026-09-10T06:00:00.000-06:00",
    780000,
    0,
    "current",
  ],
  [
    "business-abarrotes-norte",
    "Abarrotes del Norte",
    "Sandra Milagro Pineda",
    "Local E-04",
    "Abarrotes",
    "2026-09-08T06:00:00.000-06:00",
    810000,
    405000,
    "pending",
  ],
  [
    "business-cosecha-fresca",
    "Cosecha Fresca Sula",
    "Luis Fernando Aguilar",
    "Puesto F-02",
    "Frutas y verduras",
    "2026-09-05T06:00:00.000-06:00",
    690000,
    0,
    "current",
  ],
];

export const tenantAccounts = accountSeeds.map(
  ([
    businessId,
    businessName,
    responsibleName,
    stallLabel,
    categoryName,
    nextDueDate,
    monthlyAmountMinor,
    outstandingBalanceMinor,
    accountStatus,
  ]) => ({
    id: businessId,
    businessId,
    businessName,
    responsibleName,
    stallLabel,
    categoryName,
    leaseStatus: "active",
    nextDueDate,
    monthlyAmountMinor,
    outstandingBalanceMinor,
    accountStatus,
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  }),
);

export const tenantPayments = tenantAccounts.flatMap((account, index) => {
  const status =
    account.accountStatus === "overdue"
      ? "overdue"
      : account.accountStatus === "pending"
        ? account.outstandingBalanceMinor < account.monthlyAmountMinor
          ? "partial"
          : "pending"
        : "paid";
  const paidAmountMinor =
    status === "paid"
      ? account.monthlyAmountMinor
      : status === "partial"
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
      paidAmountMinor,
      status,
      ...(status === "paid" || status === "partial"
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
  ];
});
