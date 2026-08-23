const publicTimestamp = "2026-08-22T00:00:00.000Z";

export const businesses = [
  [
    "business-frutas-valle",
    "Comercial Frutas del Valle",
    "comercial-frutas-del-valle",
  ],
  ["business-la-huerta", "Verduras La Huerta", "verduras-la-huerta"],
  ["business-granos-sula", "Granos y Más Sula", "granos-y-mas-sula"],
  [
    "business-lacteos-esperanza",
    "Lácteos La Esperanza",
    "lacteos-la-esperanza",
  ],
  ["business-abarrotes-norte", "Abarrotes del Norte", "abarrotes-del-norte"],
  ["business-cosecha-fresca", "Cosecha Fresca Sula", "cosecha-fresca-sula"],
].map(([id, name, slug]) => ({
  id,
  name,
  slug,
  status: "active",
  isDemo: true,
  createdAt: publicTimestamp,
  updatedAt: publicTimestamp,
}));

export const categories = [
  ["category-fruits", "Frutas", "frutas"],
  ["category-vegetables", "Verduras", "verduras"],
  ["category-grains", "Granos", "granos"],
  ["category-dairy", "Lácteos", "lacteos"],
  ["category-groceries", "Abarrotes", "abarrotes"],
].map(([id, name, slug]) => ({
  id,
  name,
  slug,
  visible: true,
  isDemo: true,
  createdAt: publicTimestamp,
  updatedAt: publicTimestamp,
}));

const merchantSeeds = [
  [
    "merchant-frutas-valle",
    "business-frutas-valle",
    "Comercial Frutas del Valle",
    ["category-fruits", "category-vegetables"],
  ],
  [
    "merchant-la-huerta",
    "business-la-huerta",
    "Verduras La Huerta",
    ["category-vegetables"],
  ],
  [
    "merchant-granos-sula",
    "business-granos-sula",
    "Granos y Más Sula",
    ["category-grains", "category-groceries"],
  ],
  [
    "merchant-lacteos-esperanza",
    "business-lacteos-esperanza",
    "Lácteos La Esperanza",
    ["category-dairy"],
  ],
  [
    "merchant-abarrotes-norte",
    "business-abarrotes-norte",
    "Abarrotes del Norte",
    ["category-groceries", "category-grains"],
  ],
  [
    "merchant-cosecha-fresca",
    "business-cosecha-fresca",
    "Cosecha Fresca Sula",
    ["category-fruits", "category-vegetables"],
  ],
];

export const merchants = merchantSeeds.map(
  ([id, businessId, displayName, categoryIds]) => ({
    id,
    businessId,
    displayName,
    categoryIds,
    status: "active",
    verificationLabel: "demo",
    isDemo: true,
    createdAt: publicTimestamp,
    updatedAt: publicTimestamp,
  }),
);

const productSeeds = [
  [
    "product-tomato",
    "business-frutas-valle",
    "category-vegetables",
    "Tomate Saladette",
    "kg",
    1200,
  ],
  [
    "product-watermelon",
    "business-frutas-valle",
    "category-fruits",
    "Sandía",
    "kg",
    600,
  ],
  [
    "product-cabbage",
    "business-la-huerta",
    "category-vegetables",
    "Repollo Verde",
    "unidad",
    600,
  ],
  [
    "product-onion",
    "business-la-huerta",
    "category-vegetables",
    "Cebolla Blanca",
    "kg",
    700,
  ],
  [
    "product-rice",
    "business-granos-sula",
    "category-grains",
    "Arroz Blanco",
    "libra",
    1800,
  ],
  [
    "product-beans",
    "business-granos-sula",
    "category-grains",
    "Frijol Rojo",
    "libra",
    2400,
  ],
  [
    "product-milk",
    "business-lacteos-esperanza",
    "category-dairy",
    "Leche Entera",
    "litro",
    3200,
  ],
  [
    "product-cheese",
    "business-lacteos-esperanza",
    "category-dairy",
    "Queso Fresco",
    "libra",
    7200,
  ],
  [
    "product-abarrotes-rice",
    "business-abarrotes-norte",
    "category-groceries",
    "Arroz Empacado",
    "paquete",
    3600,
  ],
  [
    "product-abarrotes-oil",
    "business-abarrotes-norte",
    "category-groceries",
    "Aceite Vegetal",
    "unidad",
    4800,
  ],
  [
    "product-banana",
    "business-cosecha-fresca",
    "category-fruits",
    "Plátano Maduro",
    "docena",
    1000,
  ],
  [
    "product-potato",
    "business-cosecha-fresca",
    "category-vegetables",
    "Papa Blanca",
    "kg",
    850,
  ],
];

export const products = productSeeds.map(
  ([id, businessId, categoryId, name, unit, amountMinor]) => ({
    id,
    businessId,
    categoryId,
    name,
    unit,
    referencePrice: { amountMinor, currency: "HNL" },
    availability: "available",
    status: "active",
    isDemo: true,
    createdAt: publicTimestamp,
    updatedAt: publicTimestamp,
  }),
);

export const privateFixtures = [
  {
    id: "seed-quote-frutas-001",
    businessId: "business-frutas-valle",
    customerId: "seed-customer-frutas-001",
    customerName: "Restaurante Demo Norte",
    customerType: "restaurant",
    phone: "00000000",
    fulfillment: "pickup",
    notes: "Solicitud ficticia para demostrar el flujo del CRM.",
    items: [
      {
        productId: "product-tomato",
        productName: "Tomate Saladette",
        quantity: 12,
        unit: "kg",
      },
    ],
  },
  {
    id: "seed-quote-frutas-002",
    businessId: "business-frutas-valle",
    customerId: "seed-customer-frutas-002",
    customerName: "Supermercado Demo Sula",
    customerType: "supermarket",
    phone: "00000000",
    fulfillment: "delivery",
    notes: "Datos completamente demostrativos.",
    items: [
      {
        productId: "product-watermelon",
        productName: "Sandía",
        quantity: 20,
        unit: "kg",
      },
    ],
  },
];
