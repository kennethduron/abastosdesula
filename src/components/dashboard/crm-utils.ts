import type {
  CustomerType,
  QuoteRequest,
  QuoteRequestSource,
  QuoteRequestStatus,
} from "@/domain";

export const statusOptions: Array<{
  value: QuoteRequestStatus;
  label: string;
}> = [
  { value: "new", label: "Nueva" },
  { value: "in_review", label: "En revisión" },
  { value: "quoted", label: "Cotizada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "preparing", label: "En preparación" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

export const statusStyles: Record<QuoteRequestStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-200",
  in_review: "bg-amber-50 text-amber-700 ring-amber-200",
  quoted: "bg-violet-50 text-violet-700 ring-violet-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  preparing: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  completed: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const sourceLabels: Record<QuoteRequestSource, string> = {
  platform: "Plataforma",
  whatsapp: "WhatsApp",
  phone: "Teléfono",
  in_person: "Presencial",
  other: "Otro",
};

export const customerTypeLabels: Record<CustomerType, string> = {
  person: "Persona",
  restaurant: "Restaurante",
  supermarket: "Supermercado",
  business: "Negocio",
  other: "Otro",
};

export const fulfillmentLabels: Record<QuoteRequest["fulfillment"], string> = {
  pickup: "Retiro",
  delivery: "Entrega",
  coordinate: "Coordinar con el comerciante",
};

export function statusLabel(status: QuoteRequestStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

export function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function formatMoney(amountMinor: number) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function requestReference(
  request: Pick<QuoteRequest, "id" | "createdAt">,
) {
  const date = new Date(request.createdAt);
  const datePart = Number.isNaN(date.getTime())
    ? "000000"
    : `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  let hash = 0;
  for (const character of request.id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `SOL-${datePart}-${hash.toString(36).toUpperCase().padStart(4, "0").slice(-4)}`;
}

export function estimatedRequestValue(request: QuoteRequest) {
  return request.items.reduce(
    (total, item) =>
      total + (item.referencePriceMinor ?? 0) * Number(item.quantity || 0),
    0,
  );
}

export function requestValue(request: QuoteRequest) {
  return request.quotation?.totalMinor ?? estimatedRequestValue(request);
}

export function whatsappUrl(
  phone: string | undefined,
  customerName: string,
  reference?: string,
) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const safeDigits = digits.length === 8 ? `504${digits}` : digits;
  if (safeDigits.length < 8 || safeDigits.length > 15) return null;
  const message = reference
    ? `Hola ${customerName}, le contactamos acerca de su solicitud ${reference}.`
    : `Hola ${customerName}, le contactamos de parte de Central de Abastos de Sula.`;
  return `https://wa.me/${safeDigits}?text=${encodeURIComponent(message)}`;
}
