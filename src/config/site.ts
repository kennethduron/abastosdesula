export const siteConfig = {
  name: "Central de Abastos de Sula",
  description:
    "Encuentra comerciantes, productos frescos y opciones de cotización en la Central de Abastos de Sula.",
  whatsappDemoUrl:
    "https://wa.me/?text=Hola%2C%20quiero%20conocer%20m%C3%A1s%20sobre%20la%20Central%20de%20Abastos%20de%20Sula.",
} as const;

export const publicNavigation = [
  { label: "Inicio", href: "/" },
  { label: "Comerciantes", href: "/comerciantes" },
  { label: "Productos", href: "/productos" },
  { label: "Promociones", href: "/promociones" },
  { label: "Noticias", href: "/noticias" },
  { label: "Contacto", href: "/contacto" },
] as const;
