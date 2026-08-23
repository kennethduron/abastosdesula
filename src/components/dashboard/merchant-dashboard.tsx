"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  Bell,
  Boxes,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Store,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import { Brand } from "@/components/layout/brand";
import {
  getDemoSessionServerSnapshot,
  getDemoSessionSnapshot,
  parseDemoSession,
  setDemoSession,
  subscribeToDemoSession,
} from "@/data/adapters/browser/demo-session-store";
import {
  ensureDemoQuoteSeed,
  getStoredDemoQuoteRequestsServerSnapshot,
  getStoredDemoQuoteRequestsSnapshot,
  parseStoredDemoQuoteRequests,
  subscribeToStoredDemoQuoteRequests,
  updateStoredDemoQuoteRequestStatus,
} from "@/data/adapters/browser/quote-request-store";
import { useFirebaseQuoteRequests } from "@/data/adapters/firebase/use-quote-requests";
import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import type { QuoteRequest, QuoteRequestStatus } from "@/domain";
import { cn } from "@/lib/utils";

interface DashboardBusiness {
  id: string;
  name: string;
  productCount: number;
}

const statusOptions: Array<{ value: QuoteRequestStatus; label: string }> = [
  { value: "new", label: "Nueva" },
  { value: "in_review", label: "En revisión" },
  { value: "quoted", label: "Cotizada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "preparing", label: "Preparando" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
];

const statusStyles: Record<QuoteRequestStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-200",
  in_review: "bg-amber-50 text-amber-700 ring-amber-200",
  quoted: "bg-violet-50 text-violet-700 ring-violet-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  preparing: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  completed: "bg-green-50 text-green-700 ring-green-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

function statusLabel(status: QuoteRequestStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function endSession(
  firebaseAuthenticated: boolean,
  navigate: () => void,
) {
  if (!firebaseAuthenticated) {
    setDemoSession(null);
    return;
  }
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(getFirebaseAuth()).catch(() => undefined);
  navigate();
}

export function MerchantDashboard({
  businesses,
  firebaseSession,
}: {
  businesses: DashboardBusiness[];
  firebaseSession?: {
    role: "merchant";
    businessId: string;
    businessName: string;
  };
}) {
  const sessionSnapshot = useSyncExternalStore(
    subscribeToDemoSession,
    getDemoSessionSnapshot,
    getDemoSessionServerSnapshot,
  );
  const session = firebaseSession ?? parseDemoSession(sessionSnapshot);
  const business = businesses.find(
    (item) =>
      item.id === (session?.role === "merchant" ? session.businessId : ""),
  );

  if (!session || session.role !== "merchant" || !business) {
    return <DemoAccessGate businesses={businesses} />;
  }

  return (
    <DashboardView
      business={business}
      firebaseAuthenticated={Boolean(firebaseSession)}
    />
  );
}

function DemoAccessGate({ businesses }: { businesses: DashboardBusiness[] }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const business = businesses.find((item) => item.id === businessId);

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_right,_rgba(22,155,69,0.14),_transparent_32%),linear-gradient(135deg,#f8fafc,#edf6f0)] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-brand-navy/10 sm:p-9">
        <Brand />
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-green-pale px-3 py-1.5 text-xs font-bold text-brand-green-dark">
          <Store className="size-4" aria-hidden="true" />
          Acceso local de demostración
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
          Panel del comerciante
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Selecciona un negocio ficticio para explorar su CRM. Esta sesión no es
          autenticación real y solo guarda datos en este navegador.
        </p>
        <form
          className="mt-7 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!business) return;
            ensureDemoQuoteSeed();
            setDemoSession({
              role: "merchant",
              businessId: business.id,
              businessName: business.name,
            });
          }}
        >
          <label className="block text-sm font-bold text-brand-navy">
            Comerciante demo
            <select
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-medium outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
            >
              {businesses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button-primary w-full">
            Entrar al panel demo
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Entorno de prueba · Sin pagos, mensajes ni operaciones reales
        </p>
      </section>
    </main>
  );
}

function DashboardView({
  business,
  firebaseAuthenticated,
}: {
  business: DashboardBusiness;
  firebaseAuthenticated: boolean;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuoteRequestStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const quoteSnapshot = useSyncExternalStore(
    subscribeToStoredDemoQuoteRequests,
    getStoredDemoQuoteRequestsSnapshot,
    getStoredDemoQuoteRequestsServerSnapshot,
  );
  const firebaseQuotes = useFirebaseQuoteRequests(
    business.id,
    firebaseAuthenticated,
  );

  useEffect(() => {
    if (!firebaseAuthenticated) ensureDemoQuoteSeed();
  }, [firebaseAuthenticated]);

  const localRequests = useMemo(
    () =>
      parseStoredDemoQuoteRequests(quoteSnapshot).filter(
        (request) => request.businessId === business.id,
      ),
    [business.id, quoteSnapshot],
  );
  const requests = firebaseAuthenticated
    ? firebaseQuotes.requests
    : localRequests;
  const filteredRequests = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es-HN");
    return requests.filter(
      (request) =>
        (status === "all" || request.status === status) &&
        (!normalized ||
          request.customerName
            .toLocaleLowerCase("es-HN")
            .includes(normalized) ||
          request.items.some((item) =>
            item.productName.toLocaleLowerCase("es-HN").includes(normalized),
          )),
    );
  }, [requests, search, status]);
  const selectedRequest = requests.find((request) => request.id === selectedId);
  const uniqueCustomers = new Set(requests.map((request) => request.customerId))
    .size;
  const completed = requests.filter(
    (request) => request.status === "completed",
  ).length;
  const newRequests = requests.filter(
    (request) => request.status === "new",
  ).length;

  return (
    <div className="min-h-dvh bg-[#f5f7fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-navy px-5 py-5 text-white lg:flex">
        <Brand inverse compact />
        <BusinessIdentity business={business} />
        <DashboardNav />
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="text-xs text-slate-400">
            {firebaseAuthenticated
              ? "Sesión Firebase de demostración"
              : "Sesión local de demostración"}
          </p>
          <button
            type="button"
            onClick={() =>
              void endSession(firebaseAuthenticated, () =>
                router.replace("/acceso"),
              )
            }
            className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión demo
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:ml-64">
        <div className="flex min-h-17 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Abrir navegación"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue lg:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-brand-navy">
              {business.name}
            </p>
            <p className="text-xs text-slate-500">
              {firebaseAuthenticated
                ? "Panel demo · Sincronizado"
                : "Panel demo · Datos locales"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Notificaciones demo"
            className="relative grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
            <Bell className="size-5" />
            {newRequests > 0 && (
              <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-brand-green text-[0.6rem] font-bold text-white">
                {newRequests}
              </span>
            )}
          </button>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="grid size-9 place-items-center rounded-full bg-brand-green-pale text-brand-green-dark">
              <CircleUserRound className="size-5" />
            </span>
            <span className="text-sm font-bold text-brand-navy">
              Comerciante demo
            </span>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <DashboardNav light onNavigate={() => setMobileMenuOpen(false)} />
            <button
              type="button"
              onClick={() =>
                void endSession(firebaseAuthenticated, () =>
                  router.replace("/acceso"),
                )
              }
              className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="size-4" /> Cerrar sesión demo
            </button>
          </div>
        )}
      </header>

      <main className="pb-24 md:pb-10 lg:ml-64">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div
            id="resumen"
            className="flex scroll-mt-24 flex-col justify-between gap-3 sm:flex-row sm:items-end"
          >
            <div>
              <p className="text-sm font-bold text-brand-green-dark">
                Resumen del negocio
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">
                Resumen general
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {firebaseAuthenticated
                  ? "Solicitudes sincronizadas de forma segura por negocio."
                  : "Solicitudes y actividad guardadas en este navegador."}
              </p>
            </div>
            <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
              Entorno demo
            </span>
          </div>

          <section
            aria-label="Métricas del negocio"
            className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            <MetricCard
              icon={ClipboardList}
              label="Solicitudes nuevas"
              value={newRequests}
              tone="blue"
            />
            <MetricCard
              icon={UsersRound}
              label="Clientes registrados"
              value={uniqueCustomers}
              tone="green"
            />
            <MetricCard
              icon={Boxes}
              label="Productos demo"
              value={business.productCount}
              tone="violet"
            />
            <MetricCard
              icon={ShoppingBag}
              label="Completadas"
              value={completed}
              tone="amber"
            />
          </section>

          <section
            id="solicitudes"
            className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-lg font-black text-brand-navy">
                    Solicitudes
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Gestiona el estado y revisa el historial.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_11rem]">
                  <label className="relative block">
                    <span className="sr-only">Buscar solicitudes</span>
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar cliente o producto"
                      className="min-h-11 w-full rounded-xl border border-slate-300 pr-3 pl-10 text-sm outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filtrar por estado</span>
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value as QuoteRequestStatus | "all",
                        )
                      }
                      className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
                    >
                      <option value="all">Todos los estados</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
            {firebaseQuotes.error && (
              <p
                role="alert"
                className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700"
              >
                {firebaseQuotes.error}
              </p>
            )}
            <RequestList requests={filteredRequests} onSelect={setSelectedId} />
          </section>

          <div
            id="productos"
            className="mt-6 grid scroll-mt-24 gap-6 xl:grid-cols-[1.2fr_0.8fr]"
          >
            <StatusOverview requests={requests} />
            <RecentCustomers requests={requests} />
          </div>
        </div>
      </main>

      <nav
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <MobileNavItem
          href="#resumen"
          icon={LayoutDashboard}
          label="Resumen"
          active
        />
        <MobileNavItem
          href="#solicitudes"
          icon={ClipboardList}
          label="Solicitudes"
        />
        <MobileNavItem href="#clientes" icon={UsersRound} label="Clientes" />
        <MobileNavItem href="#productos" icon={Boxes} label="Productos" />
      </nav>

      <RequestDetails
        request={selectedRequest}
        onClose={() => setSelectedId(null)}
        onStatusChange={(nextStatus) => {
          if (!selectedRequest) return;
          if (firebaseAuthenticated) {
            void firebaseQuotes.updateStatus(selectedRequest.id, nextStatus);
            return;
          }
          updateStoredDemoQuoteRequestStatus({
            businessId: business.id,
            requestId: selectedRequest.id,
            status: nextStatus,
          });
        }}
      />
    </div>
  );
}

function BusinessIdentity({ business }: { business: DashboardBusiness }) {
  return (
    <div className="mt-8 flex items-center gap-3 border-y border-white/10 py-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-green text-lg font-black text-white">
        {business.name.charAt(0)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">{business.name}</p>
        <p className="mt-1 text-xs text-brand-green-light">Comerciante demo</p>
      </div>
    </div>
  );
}

function DashboardNav({
  light = false,
  onNavigate,
}: {
  light?: boolean;
  onNavigate?: () => void;
}) {
  const links = [
    ["#resumen", LayoutDashboard, "Resumen"],
    ["#solicitudes", ClipboardList, "Solicitudes"],
    ["#clientes", UsersRound, "Clientes"],
    ["#productos", Boxes, "Productos"],
  ] as const;
  return (
    <nav aria-label="Navegación del panel" className="mt-5 space-y-1">
      {links.map(([href, Icon, label], index) => (
        <a
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-2",
            index === 0 && !light && "bg-brand-green text-white",
            index !== 0 &&
              !light &&
              "text-slate-300 hover:bg-white/10 hover:text-white",
            light &&
              "text-brand-navy hover:bg-slate-100 focus-visible:outline-brand-blue",
          )}
        >
          <Icon className="size-5" aria-hidden="true" /> {label}
        </a>
      ))}
    </nav>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  tone: "blue" | "green" | "violet" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          tones[tone],
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-xs font-semibold text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-brand-navy sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-[0.7rem] font-semibold text-brand-green-dark">
        Datos locales demo
      </p>
    </article>
  );
}

function StatusBadge({ status }: { status: QuoteRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function RequestList({
  requests,
  onSelect,
}: {
  requests: QuoteRequest[];
  onSelect: (id: string) => void;
}) {
  if (!requests.length) {
    return (
      <div className="px-5 py-14 text-center">
        <ClipboardList className="mx-auto size-9 text-slate-300" />
        <p className="mt-3 font-bold text-brand-navy">
          No hay solicitudes con estos filtros
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Prueba otra búsqueda o estado.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="hidden grid-cols-[minmax(13rem,1fr)_minmax(10rem,0.8fr)_8rem_7rem] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase md:grid">
        <span>Cliente</span>
        <span>Producto</span>
        <span>Estado</span>
        <span className="text-right">Fecha</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {requests.map((request) => (
          <li key={request.id}>
            <button
              type="button"
              onClick={() => onSelect(request.id)}
              className="grid min-h-20 w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 focus-visible:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-blue md:grid-cols-[minmax(13rem,1fr)_minmax(10rem,0.8fr)_8rem_7rem] md:px-5"
            >
              <span className="min-w-0">
                <span className="block truncate font-extrabold text-brand-navy">
                  {request.customerName}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {request.id.replace("quote-", "#").slice(0, 18)}
                </span>
              </span>
              <span className="truncate text-sm text-slate-600">
                {request.items[0]?.productName ?? "Sin producto"}
                {request.items.length > 1
                  ? ` +${request.items.length - 1}`
                  : ""}
              </span>
              <span>
                <StatusBadge status={request.status} />
              </span>
              <span className="text-sm text-slate-500 md:text-right">
                {formatDate(request.createdAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusOverview({ requests }: { requests: QuoteRequest[] }) {
  const values = statusOptions.slice(0, 6).map((option) => ({
    ...option,
    count: requests.filter((request) => request.status === option.value).length,
  }));
  const max = Math.max(1, ...values.map((item) => item.count));
  return (
    <section
      aria-labelledby="status-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 id="status-title" className="font-black text-brand-navy">
        Actividad por estado
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Distribución actual de solicitudes demo.
      </p>
      <div className="mt-6 space-y-4">
        {values.map((item) => (
          <div
            key={item.value}
            className="grid grid-cols-[5.5rem_1fr_1.5rem] items-center gap-3 text-xs sm:grid-cols-[7rem_1fr_2rem]"
          >
            <span className="font-semibold text-slate-600">{item.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-brand-green transition-[width]"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </span>
            <span className="text-right font-black text-brand-navy">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentCustomers({ requests }: { requests: QuoteRequest[] }) {
  const customers = Array.from(
    new Map(requests.map((request) => [request.customerId, request])).values(),
  ).slice(0, 5);
  return (
    <section
      id="clientes"
      aria-labelledby="customers-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 id="customers-title" className="font-black text-brand-navy">
        Clientes recientes
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Generados por solicitudes de cotización.
      </p>
      <ul className="mt-5 divide-y divide-slate-100">
        {customers.map((customer) => (
          <li
            key={customer.customerId}
            className="flex items-center gap-3 py-3 first:pt-0"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
              {customer.customerName
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-brand-navy">
                {customer.customerName}
              </span>
              <span className="block text-xs text-slate-500">
                {customer.phone}
              </span>
            </span>
            <Clock3 className="size-4 text-slate-300" aria-hidden="true" />
          </li>
        ))}
        {!customers.length && (
          <li className="py-8 text-center text-sm text-slate-500">
            Sin clientes todavía.
          </li>
        )}
      </ul>
    </section>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-[0.65rem] font-bold focus-visible:outline-2 focus-visible:outline-brand-blue",
        active ? "text-brand-green-dark" : "text-slate-500",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </a>
  );
}

function RequestDetails({
  request,
  onClose,
  onStatusChange,
}: {
  request?: QuoteRequest;
  onClose: () => void;
  onStatusChange: (status: QuoteRequestStatus) => void;
}) {
  return (
    <Dialog.Root
      open={Boolean(request)}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-brand-navy/45 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-200 data-ending-style:translate-x-full data-starting-style:translate-x-full">
          {request && (
            <>
              <div className="sticky top-0 z-10 flex items-start gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-xl font-black text-brand-navy">
                    Detalle de solicitud
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 truncate text-sm text-slate-500">
                    {request.customerName} · {request.id.replace("quote-", "#")}
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Cerrar detalle"
                  className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
                >
                  <X className="size-5" />
                </Dialog.Close>
              </div>
              <div className="space-y-6 p-5 sm:p-7">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-sm font-bold text-brand-navy">
                    Estado de la solicitud
                    <select
                      value={request.status}
                      onChange={(event) =>
                        onStatusChange(event.target.value as QuoteRequestStatus)
                      }
                      className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <section>
                  <h3 className="font-black text-brand-navy">Cliente</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Nombre" value={request.customerName} />
                    <Detail label="Teléfono" value={request.phone} />
                    <Detail label="Tipo" value={request.customerType} />
                    <Detail label="Modalidad" value={request.fulfillment} />
                  </dl>
                </section>
                <section>
                  <h3 className="font-black text-brand-navy">
                    Productos solicitados
                  </h3>
                  <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
                    {request.items.map((item) => (
                      <li
                        key={item.productId}
                        className="flex justify-between gap-4 py-3 text-sm"
                      >
                        <span className="font-semibold text-brand-navy">
                          {item.productName}
                        </span>
                        <span className="text-slate-600">
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                {request.notes && (
                  <section>
                    <h3 className="font-black text-brand-navy">
                      Observaciones
                    </h3>
                    <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {request.notes}
                    </p>
                  </section>
                )}
                <section>
                  <h3 className="font-black text-brand-navy">Historial</h3>
                  <ol className="mt-4 space-y-4">
                    {[...request.history].reverse().map((event, index) => (
                      <li
                        key={`${event.changedAt}-${index}`}
                        className="relative flex gap-3"
                      >
                        <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-green ring-4 ring-brand-green-pale" />
                        <span>
                          <span className="block text-sm font-bold text-brand-navy">
                            {statusLabel(event.status)}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {formatDate(event.changedAt)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-brand-navy">{value}</dd>
    </div>
  );
}
