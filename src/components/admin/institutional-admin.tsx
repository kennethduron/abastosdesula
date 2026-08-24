"use client";

import {
  Activity,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Eye,
  EyeOff,
  FolderTree,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  PackageSearch,
  Settings2,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
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
  getInstitutionalAdminServerSnapshot,
  getInstitutionalAdminSnapshot,
  parseInstitutionalAdminState,
  subscribeToInstitutionalAdminState,
  toggleDemoCategoryVisibility,
  updateDemoBusinessStatus,
} from "@/data/adapters/browser/institutional-admin-store";
import {
  ensureDemoQuoteSeed,
  getStoredDemoQuoteRequestsServerSnapshot,
  getStoredDemoQuoteRequestsSnapshot,
  parseStoredDemoQuoteRequests,
  subscribeToStoredDemoQuoteRequests,
} from "@/data/adapters/browser/quote-request-store";
import { useFirebaseInstitutionalActivities } from "@/data/adapters/firebase/use-institutional-activities";
import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import type { BusinessStatus, QuoteRequestStatus } from "@/domain";
import { cn } from "@/lib/utils";

interface AdminBusiness {
  id: string;
  name: string;
  status: BusinessStatus;
  productCount: number;
  categoryCount: number;
}

interface AdminCategory {
  id: string;
  name: string;
  productCount: number;
  merchantCount: number;
}

const quoteStatusLabels: Record<QuoteRequestStatus, string> = {
  new: "Nuevas",
  in_review: "En revisión",
  quoted: "Cotizadas",
  confirmed: "Confirmadas",
  preparing: "Preparando",
  completed: "Completadas",
  cancelled: "Canceladas",
};

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

export function InstitutionalAdmin({
  businesses,
  categories,
  firebaseAuthenticated = false,
}: {
  businesses: AdminBusiness[];
  categories: AdminCategory[];
  firebaseAuthenticated?: boolean;
}) {
  const sessionSnapshot = useSyncExternalStore(
    subscribeToDemoSession,
    getDemoSessionSnapshot,
    getDemoSessionServerSnapshot,
  );
  const session = firebaseAuthenticated
    ? ({ role: "institutional_admin" } as const)
    : parseDemoSession(sessionSnapshot);

  if (session?.role === "merchant") {
    return <RestrictedMerchantAccess businessName={session.businessName} />;
  }
  if (session?.role !== "institutional_admin") {
    return <AdminAccessGate />;
  }
  return (
    <AdminDashboard
      businesses={businesses}
      categories={categories}
      firebaseAuthenticated={firebaseAuthenticated}
    />
  );
}

function AdminAccessGate() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(23,116,209,0.12),_transparent_34%),linear-gradient(135deg,#f8fafc,#edf4f8)] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-brand-navy/10 sm:p-9">
        <Brand />
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Acceso institucional
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
          Administración central
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Consulta actividad agregada, comerciantes y contenido institucional
          desde una vista de revisión autorizada.
        </p>
        <button
          type="button"
          onClick={() => {
            ensureDemoQuoteSeed();
            setDemoSession({ role: "institutional_admin" });
          }}
          className="button-primary mt-7 w-full"
        >
          Entrar a administración
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Información institucional agregada · Sin datos financieros privados
        </p>
      </section>
    </main>
  );
}

function RestrictedMerchantAccess({ businessName }: { businessName: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-700">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-brand-navy">
          Acceso institucional restringido
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          La sesión de <strong>{businessName}</strong> pertenece a un
          comerciante y no puede abrir la administración central.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a href="/panel" className="button-primary">
            Volver a mi panel
          </a>
          <button
            type="button"
            onClick={() => setDemoSession(null)}
            className="button-secondary"
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}

function AdminDashboard({
  businesses,
  categories,
  firebaseAuthenticated,
}: {
  businesses: AdminBusiness[];
  categories: AdminCategory[];
  firebaseAuthenticated: boolean;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminSnapshot = useSyncExternalStore(
    subscribeToInstitutionalAdminState,
    getInstitutionalAdminSnapshot,
    getInstitutionalAdminServerSnapshot,
  );
  const quoteSnapshot = useSyncExternalStore(
    subscribeToStoredDemoQuoteRequests,
    getStoredDemoQuoteRequestsSnapshot,
    getStoredDemoQuoteRequestsServerSnapshot,
  );
  const adminState = useMemo(
    () => parseInstitutionalAdminState(adminSnapshot),
    [adminSnapshot],
  );
  const localRequests = useMemo(
    () => parseStoredDemoQuoteRequests(quoteSnapshot),
    [quoteSnapshot],
  );
  const firebaseActivity = useFirebaseInstitutionalActivities(
    firebaseAuthenticated,
  );
  const requestActivities = firebaseAuthenticated
    ? firebaseActivity.activities.filter(
        (activity) => activity.type === "quote_request_created",
      )
    : [];
  const requestCount = firebaseAuthenticated
    ? requestActivities.length
    : localRequests.length;
  const resolvedBusinesses = businesses.map((business) => ({
    ...business,
    status: adminState.businessStatuses[business.id] ?? business.status,
    requestCount: firebaseAuthenticated
      ? requestActivities.filter(
          (activity) => activity.businessId === business.id,
        ).length
      : localRequests.filter((request) => request.businessId === business.id)
          .length,
  }));
  const activeBusinesses = resolvedBusinesses.filter(
    (business) => business.status === "active",
  ).length;
  const totalProducts = businesses.reduce(
    (total, business) => total + business.productCount,
    0,
  );

  return (
    <div className="min-h-dvh w-full max-w-full bg-[#f5f7fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-navy px-5 py-5 text-white lg:flex">
        <Brand inverse compact />
        <div className="mt-8 border-y border-white/10 py-5">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-blue text-white">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-extrabold">Administración Central</p>
          <p className="mt-1 text-xs text-blue-200">Rol institucional</p>
        </div>
        <AdminNav />
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="text-xs text-slate-400">
            Vista agregada · Sin finanzas privadas
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
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:ml-64">
        <div className="flex min-h-17 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Abrir navegación administrativa"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue lg:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-brand-navy">
              Central de Abastos de Sula
            </p>
            <p className="text-xs text-slate-500">
              Administración institucional
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 sm:inline-flex">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Administrador institucional
          </span>
          <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-brand-navy">
            <CircleUserRound className="size-5" aria-hidden="true" />
          </span>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <AdminNav light onNavigate={() => setMobileMenuOpen(false)} />
            <button
              type="button"
              onClick={() =>
                void endSession(firebaseAuthenticated, () =>
                  router.replace("/acceso"),
                )
              }
              className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className="w-full max-w-full min-w-0 pb-10 lg:ml-64 lg:w-auto">
        <div className="mx-auto w-full max-w-[1500px] min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div id="resumen" className="scroll-mt-24">
            <p className="text-sm font-bold text-brand-blue">
              Panorama institucional
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">
              Resumen de la plataforma
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Información operativa agregada para la gestión institucional. No
              se muestran ventas, cobros ni finanzas detalladas de comerciantes.
            </p>
          </div>

          <section
            aria-label="Métricas institucionales"
            className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            <AdminMetric
              icon={Building2}
              label="Comerciantes activos"
              value={activeBusinesses}
              tone="green"
            />
            <AdminMetric
              icon={ClipboardList}
              label="Solicitudes"
              value={requestCount}
              tone="blue"
            />
            <AdminMetric
              icon={FolderTree}
              label="Categorías"
              value={categories.length}
              tone="violet"
            />
            <AdminMetric
              icon={PackageSearch}
              label="Productos"
              value={totalProducts}
              tone="amber"
            />
          </section>

          <section
            id="comerciantes"
            className="mt-6 w-full max-w-[calc(100vw-2rem)] min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:max-w-[calc(100vw-3rem)] lg:max-w-full"
          >
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-black text-brand-navy">
                Comerciantes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Estado y actividad operativa agregada por negocio.
              </p>
            </div>
            <div className="hidden w-full max-w-full overflow-x-auto overscroll-x-contain md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Comerciante</th>
                    <th className="px-5 py-3">Catálogo</th>
                    <th className="px-5 py-3">Solicitudes</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resolvedBusinesses.map((business) => (
                    <tr key={business.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <span className="block font-extrabold text-brand-navy">
                          {business.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {business.productCount} productos ·{" "}
                        {business.categoryCount} categorías
                      </td>
                      <td className="px-5 py-4 font-black text-brand-navy">
                        {business.requestCount}
                      </td>
                      <td className="px-5 py-4">
                        <MerchantStatusSelect business={business} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {resolvedBusinesses.map((business) => (
                <li key={business.id} className="p-4">
                  <p className="font-extrabold text-brand-navy">
                    {business.name}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">
                        Catálogo
                      </dt>
                      <dd className="mt-1 font-bold text-brand-navy">
                        {business.productCount} productos
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">
                        Solicitudes
                      </dt>
                      <dd className="mt-1 font-bold text-brand-navy">
                        {business.requestCount}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <MerchantStatusSelect business={business} fullWidth />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section
              id="actividad"
              className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-black text-brand-navy">
                Actividad agregada
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Distribución global sin datos financieros privados.
              </p>
              {firebaseActivity.error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
                >
                  {firebaseActivity.error}
                </p>
              )}
              <QuoteDistribution
                counts={
                  Object.fromEntries(
                    Object.keys(quoteStatusLabels).map((status) => [
                      status,
                      firebaseAuthenticated
                        ? status === "new"
                          ? requestCount
                          : 0
                        : localRequests.filter(
                            (request) => request.status === status,
                          ).length,
                    ]),
                  ) as Record<QuoteRequestStatus, number>
                }
              />
            </section>
            <section
              aria-labelledby="audit-title"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2
                id="audit-title"
                className="text-lg font-black text-brand-navy"
              >
                Registro administrativo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cambios recientes en comerciantes y contenido.
              </p>
              <ul className="mt-5 space-y-4">
                {adminState.activities.slice(0, 5).map((activity) => (
                  <li key={activity.id} className="flex gap-3 text-sm">
                    <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
                      <Activity className="size-3.5" />
                    </span>
                    <span>
                      <span className="block font-semibold text-brand-navy">
                        {activity.description}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {new Intl.DateTimeFormat("es-HN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(activity.createdAt))}
                      </span>
                    </span>
                  </li>
                ))}
                {!adminState.activities.length && (
                  <li className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Los cambios de estado y contenido aparecerán aquí.
                  </li>
                )}
              </ul>
            </section>
          </div>

          <section
            id="contenido"
            className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-black text-brand-navy">
                  Gestión de contenido
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Administra la visibilidad de las categorías publicadas en el
                  catálogo.
                </p>
              </div>
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                Control de visibilidad
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {categories.map((category) => {
                const hidden = adminState.hiddenCategoryIds.includes(
                  category.id,
                );
                return (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-xl",
                        hidden
                          ? "bg-slate-100 text-slate-500"
                          : "bg-brand-green-pale text-brand-green-dark",
                      )}
                    >
                      {hidden ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </span>
                    <h3 className="mt-3 font-extrabold text-brand-navy">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {category.productCount} productos ·{" "}
                      {category.merchantCount} comerciantes
                    </p>
                    <button
                      type="button"
                      aria-pressed={!hidden}
                      onClick={() =>
                        toggleDemoCategoryVisibility(category.id, category.name)
                      }
                      className="mt-4 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-bold text-brand-navy hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-blue"
                    >
                      {hidden ? "Mostrar en catálogo" : "Ocultar del catálogo"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function AdminNav({
  light = false,
  onNavigate,
}: {
  light?: boolean;
  onNavigate?: () => void;
}) {
  const links = [
    ["#resumen", LayoutDashboard, "Resumen"],
    ["#comerciantes", Store, "Comerciantes"],
    ["#actividad", ChartNoAxesCombined, "Actividad"],
    ["#contenido", Settings2, "Contenido"],
  ] as const;
  return (
    <nav aria-label="Navegación institucional" className="mt-5 space-y-1">
      {links.map(([href, Icon, label], index) => (
        <a
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-2",
            !light && index === 0 && "bg-brand-blue text-white",
            !light &&
              index !== 0 &&
              "text-slate-300 hover:bg-white/10 hover:text-white",
            light &&
              "text-brand-navy hover:bg-slate-100 focus-visible:outline-brand-blue",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}

function MerchantStatusSelect({
  business,
  fullWidth = false,
}: {
  business: AdminBusiness & { requestCount: number };
  fullWidth?: boolean;
}) {
  return (
    <label className={cn(fullWidth && "block")}>
      <span className="sr-only">Estado de {business.name}</span>
      <select
        value={business.status}
        onChange={(event) =>
          updateDemoBusinessStatus(
            business.id,
            business.name,
            event.target.value as BusinessStatus,
          )
        }
        className={cn(
          "min-h-10 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15",
          fullWidth && "w-full",
        )}
      >
        <option value="active">Activo</option>
        <option value="pending">Pendiente</option>
        <option value="inactive">Inactivo</option>
      </select>
    </label>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  tone: "green" | "blue" | "violet" | "amber";
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
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
      <p className="mt-2 inline-flex items-center gap-1 text-[0.7rem] font-semibold text-brand-green-dark">
        <CheckCircle2 className="size-3" />
        Información actualizada
      </p>
    </article>
  );
}

function QuoteDistribution({
  counts,
}: {
  counts: Record<QuoteRequestStatus, number>;
}) {
  const statuses = Object.entries(quoteStatusLabels) as Array<
    [QuoteRequestStatus, string]
  >;
  const rows = statuses.map(([status, label]) => ({
    status,
    label,
    count: counts[status],
  }));
  const max = Math.max(1, ...rows.map((item) => item.count));
  return (
    <div className="mt-6 space-y-4">
      {rows.map((item) => (
        <div
          key={item.status}
          className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3 text-xs sm:grid-cols-[8rem_1fr_2rem]"
        >
          <span className="font-semibold text-slate-600">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-brand-blue"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-black text-brand-navy">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
