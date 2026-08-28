import type { CommercialSpace } from "@/domain";

const createdAt = "2026-08-28T12:00:00.000Z";
const image = (name: string, alt: string) => ({
  src: `/images/spaces/${name}.webp`,
  alt,
});

const gallery = [
  image("local-comercial-amplio", "Interior de espacio comercial amplio"),
  image("espacio-distribucion", "Área comercial preparada para distribución"),
  image("local-alimentos", "Espacio comercial para alimentos y abarrotes"),
  image("espacio-productos-frescos", "Área preparada para productos frescos"),
  image("local-comercial-compacto", "Local comercial compacto y versátil"),
];

export const presentationCommercialSpaces: CommercialSpace[] = [
  {
    id: "space-wide-retail",
    slug: "local-comercial-amplio",
    title: "Local comercial amplio",
    shortDescription:
      "Un espacio versátil para exhibición, atención y operación comercial.",
    description:
      "Espacio de referencia con frente abierto, circulación cómoda y una distribución flexible para adaptar áreas de atención, exhibición y almacenamiento ligero dentro de la Central.",
    type: "Local comercial",
    locationLabel: "Área comercial interior",
    approximateArea: "Área amplia",
    availabilityStatus: "available",
    priceVisibility: "consult",
    features: [
      "Frente comercial abierto",
      "Iluminación natural",
      "Distribución flexible",
      "Acceso por corredor interno",
    ],
    suitableFor: ["Abarrotes", "Alimentos empacados", "Comercio especializado"],
    images: [gallery[0], gallery[2], gallery[4]],
    coverImage: gallery[0],
    published: true,
    featured: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "space-distribution",
    slug: "espacio-para-distribucion",
    title: "Espacio para distribución",
    shortDescription:
      "Configuración práctica para recepción, organización y despacho de mercadería.",
    description:
      "Espacio de referencia pensado para operaciones que requieren un área despejada, acceso amplio y capacidad de organizar inventario para distribución mayorista.",
    type: "Distribución",
    locationLabel: "Zona operativa comercial",
    approximateArea: "Área extendida",
    availabilityStatus: "available",
    priceVisibility: "request_information",
    features: [
      "Acceso amplio",
      "Piso de alta resistencia",
      "Zona adaptable para inventario",
      "Circulación operativa",
    ],
    suitableFor: ["Distribución", "Mayoreo", "Logística de alimentos"],
    images: [gallery[1], gallery[0], gallery[3]],
    coverImage: gallery[1],
    published: true,
    featured: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "space-food-grocery",
    slug: "local-para-alimentos-y-abarrotes",
    title: "Local para alimentos y abarrotes",
    shortDescription:
      "Espacio ordenado para venta y exhibición de productos de consumo.",
    description:
      "Local de referencia con superficies prácticas y una distribución que facilita combinar exhibición, mostrador y almacenamiento para una operación comercial organizada.",
    type: "Alimentos y abarrotes",
    locationLabel: "Corredor comercial cubierto",
    approximateArea: "Área mediana",
    availabilityStatus: "available",
    priceVisibility: "consult",
    features: [
      "Área de mostrador",
      "Superficies prácticas",
      "Espacio para estantería",
      "Acceso cubierto",
    ],
    suitableFor: ["Abarrotes", "Productos empacados", "Alimentos secos"],
    images: [gallery[2], gallery[0], gallery[4]],
    coverImage: gallery[2],
    published: true,
    featured: true,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "space-fresh-produce",
    slug: "espacio-para-productos-frescos",
    title: "Espacio para productos frescos",
    shortDescription:
      "Área ventilada y accesible para exhibición de frutas y verduras.",
    description:
      "Espacio de referencia con frente abierto y una configuración apropiada para exhibidores modulares, cajas y circulación de clientes en un entorno mayorista.",
    type: "Productos frescos",
    locationLabel: "Área de comercio mayorista",
    approximateArea: "Área mediana",
    availabilityStatus: "available",
    priceVisibility: "consult",
    features: [
      "Frente ventilado",
      "Buena visibilidad",
      "Montaje modular",
      "Acceso directo",
    ],
    suitableFor: ["Frutas", "Verduras", "Productos agrícolas"],
    images: [gallery[3], gallery[1], gallery[2]],
    coverImage: gallery[3],
    published: true,
    featured: false,
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "space-compact-retail",
    slug: "local-comercial-compacto",
    title: "Local comercial compacto",
    shortDescription:
      "Una opción eficiente para una operación especializada y atención directa.",
    description:
      "Local de referencia de escala compacta, con una planta sencilla que permite organizar mostrador, estantería y almacenamiento básico para conceptos comerciales especializados.",
    type: "Local compacto",
    locationLabel: "Galería comercial interior",
    approximateArea: "Área compacta",
    availabilityStatus: "available",
    priceVisibility: "request_information",
    features: [
      "Fácil organización",
      "Frente asegurado",
      "Iluminación funcional",
      "Bajo mantenimiento",
    ],
    suitableFor: [
      "Servicios al comercio",
      "Productos especializados",
      "Venta directa",
    ],
    images: [gallery[4], gallery[0], gallery[2]],
    coverImage: gallery[4],
    published: true,
    featured: false,
    createdAt,
    updatedAt: createdAt,
  },
];

export function getPresentationCommercialSpace(idOrSlug: string) {
  return presentationCommercialSpaces.find(
    (space) => space.id === idOrSlug || space.slug === idOrSlug,
  );
}
