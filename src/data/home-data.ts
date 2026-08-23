import type {
  DemoAnnouncement,
  DemoMerchant,
  DemoProduct,
  HeroSlide,
  HomeBenefit,
  HomeCategory,
} from "@/types/home";

export const heroSlides: HeroSlide[] = [
  {
    title: "Productos frescos",
    description: "Variedad para hogares y negocios",
    image: "/images/home/hero-market.webp",
    imageAlt: "Puesto de mercado con frutas y vegetales frescos",
    icon: "market",
  },
  {
    title: "Comerciantes especializados",
    description: "Encuentra proveedores por categoría",
    image: "/images/home/category-fruits.webp",
    imageAlt: "Selección colorida de frutas frescas",
    icon: "specialists",
  },
  {
    title: "Cotizaciones comerciales",
    description: "Conecta directamente con proveedores",
    image: "/images/home/category-groceries.webp",
    imageAlt: "Exhibición organizada de vegetales para compra comercial",
    icon: "business",
  },
];

export const homeBenefits: HomeBenefit[] = [
  {
    title: "Productos frescos",
    description: "Opciones para tu hogar o negocio.",
    icon: "fresh",
  },
  {
    title: "Comerciantes verificados",
    description: "Perfiles claros y confiables.",
    icon: "verified",
  },
  {
    title: "Cotizaciones rápidas",
    description: "Compara opciones con facilidad.",
    icon: "quote",
  },
  {
    title: "Contacto directo",
    description: "Conversa con cada comerciante.",
    icon: "contact",
  },
];

export const homeCategories: HomeCategory[] = [
  {
    name: "Frutas",
    description: "Frescas y de temporada",
    image: "/images/home/category-fruits.webp",
    href: "/productos?categoria=frutas",
  },
  {
    name: "Verduras",
    description: "Variedad para cada cocina",
    image: "/images/home/category-vegetables.webp",
    href: "/productos?categoria=verduras",
  },
  {
    name: "Granos",
    description: "Básicos para tu negocio",
    image: "/images/home/category-grains.webp",
    href: "/productos?categoria=granos",
  },
  {
    name: "Lácteos",
    description: "Leche y derivados",
    image: "/images/home/category-dairy.webp",
    href: "/productos?categoria=lacteos",
  },
  {
    name: "Abarrotes",
    description: "Todo en un solo lugar",
    image: "/images/home/category-groceries.webp",
    href: "/productos?categoria=abarrotes",
  },
];

// Comercios ficticios usados exclusivamente para la demostración visual.
export const demoMerchants: DemoMerchant[] = [
  {
    name: "Comercial Frutas del Valle",
    category: "Frutas y verduras",
    image: "/images/home/category-fruits.webp",
    imageAlt: "Selección colorida de frutas frescas",
    href: "/comerciantes/comercial-frutas-del-valle",
    verified: true,
  },
  {
    name: "Verduras La Huerta",
    category: "Verduras frescas",
    image: "/images/home/category-vegetables.webp",
    imageAlt: "Ensalada preparada con vegetales frescos",
    href: "/comerciantes/verduras-la-huerta",
    verified: true,
  },
  {
    name: "Granos y Más Sula",
    category: "Granos y semillas",
    image: "/images/home/category-grains.webp",
    imageAlt: "Porción de arroz blanco",
    href: "/comerciantes/granos-y-mas-sula",
    verified: true,
  },
  {
    name: "Lácteos La Esperanza",
    category: "Lácteos y derivados",
    image: "/images/home/category-dairy.webp",
    imageAlt: "Selección de lácteos, huevos y pan",
    href: "/comerciantes/lacteos-la-esperanza",
    verified: true,
  },
];

// Precios ficticios usados exclusivamente para la demostración visual.
export const demoProducts: DemoProduct[] = [
  {
    name: "Tomate Saladette",
    price: "L 12.00",
    unit: "kg",
    image: "/images/home/product-tomato.webp",
    imageAlt: "Tomates rojos frescos",
    href: "/productos/tomate-saladette",
  },
  {
    name: "Papa Blanca",
    price: "L 8.50",
    unit: "kg",
    image: "/images/home/product-potato.webp",
    imageAlt: "Papas blancas frescas",
    href: "/productos/papa-blanca",
  },
  {
    name: "Sandía",
    price: "L 6.00",
    unit: "kg",
    image: "/images/home/product-watermelon.webp",
    imageAlt: "Trozos de sandía fresca",
    href: "/productos/sandia",
  },
  {
    name: "Plátano Maduro",
    price: "L 10.00",
    unit: "docena",
    image: "/images/home/product-banana.webp",
    imageAlt: "Racimo de plátanos maduros",
    href: "/productos/platano-maduro",
  },
  {
    name: "Cebolla Blanca",
    price: "L 7.00",
    unit: "kg",
    image: "/images/home/product-onion.webp",
    imageAlt: "Cebollas frescas surtidas",
    href: "/productos/cebolla-blanca",
  },
  {
    name: "Repollo Verde",
    price: "L 6.00",
    unit: "unidad",
    image: "/images/home/product-cabbage.webp",
    imageAlt: "Repollos verdes frescos",
    href: "/productos/repollo-verde",
  },
];

// Contenido editorial ficticio para visualizar el módulo de noticias.
export const demoAnnouncements: DemoAnnouncement[] = [
  {
    eyebrow: "Guía de compra · Demo",
    title: "Cómo preparar tu lista para cotizar más rápido",
    description:
      "Organiza cantidades, unidades y fechas antes de contactar a tus proveedores.",
    href: "/noticias/guia-para-cotizar",
  },
  {
    eyebrow: "Plataforma · Demo",
    title: "Nuevas categorías para explorar productos",
    description:
      "Conoce cómo el directorio facilita la búsqueda por tipo de producto y comerciante.",
    href: "/noticias/categorias-de-productos",
  },
  {
    eyebrow: "Comerciantes · Demo",
    title: "Buenas prácticas para mantener un catálogo claro",
    description:
      "Consejos sencillos para presentar disponibilidad, unidades y precios de referencia.",
    href: "/noticias/catalogo-claro",
  },
];
