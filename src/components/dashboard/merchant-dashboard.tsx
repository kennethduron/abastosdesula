"use client";

import {
  Bell,
  Boxes,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  ClipboardList,
  Columns3,
  FileText,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  MessageCircleMore,
  PackageSearch,
  Plus,
  Search,
  ShoppingBag,
  Store,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import {
  customerTypeLabels,
  formatDate,
  formatMoney,
  requestReference,
  requestValue,
  sourceLabels,
  statusLabel,
  statusOptions,
  statusStyles,
} from "@/components/dashboard/crm-utils";
import { CustomerDetailDrawer } from "@/components/dashboard/customer-detail-drawer";
import {
  MerchantBusinessWorkspace,
  MerchantDocumentsWorkspace,
  MerchantInventoryWorkspace,
  MerchantOperationsSummary,
  MerchantProductsWorkspace,
} from "@/components/dashboard/merchant-self-service-workspaces";
import {
  ManualRequestDialog,
  type DashboardProduct,
} from "@/components/dashboard/manual-request-dialog";
import { RequestDetailDrawer } from "@/components/dashboard/request-detail-drawer";
import { Brand } from "@/components/layout/brand";
import { TenantAccountPanel } from "@/components/tenant/tenant-account-panel";
import {
  getDemoSessionServerSnapshot,
  getDemoSessionSnapshot,
  parseDemoSession,
  setDemoSession,
  subscribeToDemoSession,
} from "@/data/adapters/browser/demo-session-store";
import {
  addStoredCustomerNote,
  addStoredFollowUp,
  addStoredRequestNote,
  createStoredManualQuoteRequest,
  ensureDemoQuoteSeed,
  getStoredDemoCustomersSnapshot,
  getStoredDemoQuoteRequestsServerSnapshot,
  getStoredDemoQuoteRequestsSnapshot,
  parseStoredDemoCustomers,
  parseStoredDemoQuoteRequests,
  saveStoredQuotation,
  subscribeToStoredDemoQuoteRequests,
  toggleStoredFollowUp,
  updateStoredDemoQuoteRequestStatus,
} from "@/data/adapters/browser/quote-request-store";
import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import { useFirebaseQuoteRequests } from "@/data/adapters/firebase/use-quote-requests";
import { useFirebaseTenantBilling } from "@/data/adapters/firebase/use-tenant-billing";
import {
  tenantAccountFixtures,
  tenantPaymentFixtures,
} from "@/data/tenant-billing-fixtures";
import type {
  Customer,
  ManualQuoteRequestInput,
  QuoteRequest,
  QuoteRequestSource,
  QuoteRequestStatus,
} from "@/domain";
import { cn } from "@/lib/utils";

interface DashboardBusiness {
  id: string;
  name: string;
  productCount: number;
}

type DashboardSection =
  | "dashboard"
  | "business"
  | "products"
  | "inventory"
  | "requests"
  | "customers"
  | "documents"
  | "account";
type RequestView = "list" | "pipeline";

export function MerchantDashboard({
  businesses,
  products,
  firebaseSession,
}: {
  businesses: DashboardBusiness[];
  products: DashboardProduct[];
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
    return <AccessGate businesses={businesses} />;
  }

  return (
    <DashboardShell
      business={business}
      products={products.filter(
        (product) => product.businessId === business.id,
      )}
      firebaseAuthenticated={Boolean(firebaseSession)}
    />
  );
}

function AccessGate({ businesses }: { businesses: DashboardBusiness[] }) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const business = businesses.find((item) => item.id === businessId);
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_right,_rgba(22,155,69,0.14),_transparent_32%),linear-gradient(135deg,#f8fafc,#edf6f0)] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-brand-navy/10 sm:p-9">
        <Brand />
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-green-pale px-3 py-1.5 text-xs font-bold text-brand-green-dark">
          <Store className="size-4" /> Acceso de revisión
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
          Panel del comerciante
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Selecciona un comercio para revisar la gestión de solicitudes,
          clientes y actividad.
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
            Comerciante
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
            Entrar al panel <ChevronRight className="size-4" />
          </button>
        </form>
      </section>
    </main>
  );
}

function DashboardShell({
  business,
  products,
  firebaseAuthenticated,
}: {
  business: DashboardBusiness;
  products: DashboardProduct[];
  firebaseAuthenticated: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<DashboardSection>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const quoteSnapshot = useSyncExternalStore(
    subscribeToStoredDemoQuoteRequests,
    getStoredDemoQuoteRequestsSnapshot,
    getStoredDemoQuoteRequestsServerSnapshot,
  );
  const customerSnapshot = useSyncExternalStore(
    subscribeToStoredDemoQuoteRequests,
    getStoredDemoCustomersSnapshot,
    getStoredDemoQuoteRequestsServerSnapshot,
  );
  const firebaseCrm = useFirebaseQuoteRequests(
    business.id,
    firebaseAuthenticated,
  );
  const firebaseBilling = useFirebaseTenantBilling({
    enabled: firebaseAuthenticated,
    businessId: business.id,
  });

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
  const localCustomers = useMemo(
    () =>
      parseStoredDemoCustomers(customerSnapshot).filter(
        (customer) => customer.businessId === business.id,
      ),
    [business.id, customerSnapshot],
  );
  const requests = firebaseAuthenticated ? firebaseCrm.requests : localRequests;
  const customers = firebaseAuthenticated
    ? firebaseCrm.customers
    : localCustomers;
  const tenantAccount = firebaseAuthenticated
    ? firebaseBilling.accounts[0]
    : tenantAccountFixtures.find(
        (account) => account.businessId === business.id,
      );
  const tenantPayments = firebaseAuthenticated
    ? firebaseBilling.payments
    : tenantPaymentFixtures.filter(
        (payment) => payment.businessId === business.id,
      );
  const selectedRequest = requests.find(
    (request) => request.id === selectedRequestId,
  );
  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const selectedCustomerRequests = requests
    .filter((request) => request.customerId === selectedCustomerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const localUnread = requests.filter(
    (request) => request.status === "new",
  ).length;
  const unreadCount = firebaseAuthenticated
    ? firebaseCrm.unreadCount
    : localUnread;

  async function endSession() {
    if (!firebaseAuthenticated) {
      setDemoSession(null);
      return;
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(getFirebaseAuth()).catch(() => undefined);
    router.replace("/acceso");
  }

  const mutations = {
    updateStatus: async (status: QuoteRequestStatus) => {
      if (!selectedRequest) return;
      if (firebaseAuthenticated)
        return firebaseCrm.updateStatus(selectedRequest.id, status);
      updateStoredDemoQuoteRequestStatus({
        businessId: business.id,
        requestId: selectedRequest.id,
        status,
      });
    },
    addRequestNote: async (body: string) => {
      if (!selectedRequest) return;
      if (firebaseAuthenticated)
        return firebaseCrm.addRequestNote(selectedRequest.id, body);
      addStoredRequestNote(business.id, selectedRequest.id, body);
    },
    addFollowUp: async (input: {
      title: string;
      dueAt: string;
      note?: string;
    }) => {
      if (!selectedRequest) return;
      if (firebaseAuthenticated)
        return firebaseCrm.addFollowUp(selectedRequest.id, input);
      addStoredFollowUp(business.id, selectedRequest.id, input);
    },
    toggleFollowUp: async (followUpId: string) => {
      if (!selectedRequest) return;
      if (firebaseAuthenticated)
        return firebaseCrm.toggleFollowUp(selectedRequest.id, followUpId);
      toggleStoredFollowUp(business.id, selectedRequest.id, followUpId);
    },
    saveQuotation: async (input: Parameters<typeof saveStoredQuotation>[2]) => {
      if (!selectedRequest) return;
      if (firebaseAuthenticated)
        return firebaseCrm.saveQuotation(selectedRequest.id, input);
      saveStoredQuotation(business.id, selectedRequest.id, input);
    },
  };

  async function createManual(input: ManualQuoteRequestInput) {
    if (firebaseAuthenticated) {
      await firebaseCrm.createManualRequest(input);
      return;
    }
    createStoredManualQuoteRequest(input, business.name);
  }

  async function addCustomerNote(body: string) {
    if (!selectedCustomer) return;
    if (firebaseAuthenticated)
      return firebaseCrm.addCustomerNote(selectedCustomer.id, body);
    addStoredCustomerNote(business.id, selectedCustomer.id, body);
  }

  return (
    <div className="min-h-dvh bg-[#f4f7fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-navy px-5 py-5 text-white lg:flex">
        <Brand inverse compact />
        <div className="mt-8 flex items-center gap-3 border-y border-white/10 py-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-green text-lg font-black">
            {business.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{business.name}</p>
            <p className="mt-1 text-xs text-brand-green-light">
              Cuenta comercial
            </p>
          </div>
        </div>
        <DashboardNav section={section} onSelect={setSection} />
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="text-xs text-slate-400">Sesión protegida</p>
          <button
            type="button"
            onClick={() => void endSession()}
            className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-slate-200 hover:bg-white/10"
          >
            <LogOut className="size-4" /> Cerrar sesión
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
            className="grid size-11 place-items-center rounded-xl hover:bg-slate-100 lg:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-brand-navy">
              {business.name}
            </p>
            <p className="text-xs text-slate-500">
              Gestión comercial · Información actualizada
            </p>
          </div>
          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => void firebaseCrm.markNotificationsRead()}
            className="relative grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-brand-green px-1 text-[0.6rem] font-bold text-white">
                {Math.min(unreadCount, 99)}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="Nueva solicitud"
            onClick={() => setManualOpen(true)}
            className="button-primary min-h-11 px-3 sm:px-4"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nueva solicitud</span>
          </button>
          <div className="hidden items-center gap-2 xl:flex">
            <span className="grid size-9 place-items-center rounded-full bg-brand-green-pale text-brand-green-dark">
              <CircleUserRound className="size-5" />
            </span>
            <span className="text-sm font-bold text-brand-navy">
              Comerciante
            </span>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <DashboardNav
              light
              section={section}
              onSelect={(value) => {
                setSection(value);
                setMobileMenuOpen(false);
              }}
            />
            <button
              type="button"
              onClick={() => void endSession()}
              className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </header>

      <main className="min-w-0 pb-24 lg:ml-64 lg:pb-10">
        <div className="mx-auto max-w-[1600px] min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {firebaseCrm.error && (
            <p
              role="alert"
              className="mb-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {firebaseCrm.error}
            </p>
          )}
          {section === "dashboard" && (
            <DashboardOverview
              requests={requests}
              customers={customers}
              business={business}
              onOpenRequest={setSelectedRequestId}
              onNavigate={setSection}
              firebaseAuthenticated={firebaseAuthenticated}
            />
          )}
          {section === "business" && (
            <MerchantBusinessWorkspace
              businessId={business.id}
              enabled={firebaseAuthenticated}
            />
          )}
          {section === "products" && (
            <MerchantProductsWorkspace
              businessId={business.id}
              enabled={firebaseAuthenticated}
            />
          )}
          {section === "inventory" && (
            <MerchantInventoryWorkspace
              businessId={business.id}
              enabled={firebaseAuthenticated}
            />
          )}
          {section === "requests" && (
            <RequestsWorkspace
              requests={requests}
              customers={customers}
              onOpenRequest={setSelectedRequestId}
              onCreate={() => setManualOpen(true)}
            />
          )}
          {section === "customers" && (
            <CustomersWorkspace
              customers={customers}
              requests={requests}
              onOpenCustomer={setSelectedCustomerId}
            />
          )}
          {section === "account" && (
            <TenantAccountPanel
              account={tenantAccount}
              payments={tenantPayments}
              loading={firebaseBilling.loading}
              error={firebaseBilling.error}
            />
          )}
          {section === "documents" && <MerchantDocumentsWorkspace />}
        </div>
      </main>

      <nav
        aria-label="Navegación inferior"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <MobileNavButton
          icon={PackageSearch}
          label="Productos"
          active={section === "products"}
          onClick={() => setSection("products")}
        />
        <MobileNavButton
          icon={LayoutDashboard}
          label="Resumen"
          active={section === "dashboard"}
          onClick={() => setSection("dashboard")}
        />
        <MobileNavButton
          icon={ClipboardList}
          label="Solicitudes"
          active={section === "requests"}
          onClick={() => setSection("requests")}
        />
        <MobileNavButton
          icon={UsersRound}
          label="Clientes"
          active={section === "customers"}
          onClick={() => setSection("customers")}
        />
        <MobileNavButton
          icon={WalletCards}
          label="Cuenta"
          active={section === "account"}
          onClick={() => setSection("account")}
        />
      </nav>

      <RequestDetailDrawer
        key={selectedRequestId ?? "request-none"}
        request={selectedRequest}
        onClose={() => setSelectedRequestId(null)}
        onStatusChange={mutations.updateStatus}
        onAddNote={mutations.addRequestNote}
        onAddFollowUp={mutations.addFollowUp}
        onToggleFollowUp={mutations.toggleFollowUp}
        onSaveQuotation={mutations.saveQuotation}
      />
      <CustomerDetailDrawer
        key={selectedCustomerId ?? "customer-none"}
        customer={selectedCustomer}
        requests={selectedCustomerRequests}
        onClose={() => setSelectedCustomerId(null)}
        onAddNote={addCustomerNote}
        onSelectRequest={(requestId) => {
          setSelectedCustomerId(null);
          setSelectedRequestId(requestId);
        }}
      />
      <ManualRequestDialog
        key={manualOpen ? "manual-open" : "manual-closed"}
        open={manualOpen}
        onOpenChange={setManualOpen}
        businessId={business.id}
        customers={customers}
        products={products}
        onSave={createManual}
      />
    </div>
  );
}

function DashboardNav({
  section,
  onSelect,
  light = false,
}: {
  section: DashboardSection;
  onSelect: (section: DashboardSection) => void;
  light?: boolean;
}) {
  const links = [
    ["dashboard", LayoutDashboard, "Resumen"],
    ["business", Store, "Mi negocio"],
    ["products", PackageSearch, "Productos"],
    ["inventory", Boxes, "Inventario"],
    ["requests", ClipboardList, "Solicitudes"],
    ["customers", UsersRound, "Clientes"],
    ["documents", FileText, "Documentos"],
    ["account", WalletCards, "Estado de cuenta"],
  ] as const;
  return (
    <nav aria-label="Navegación del panel" className="mt-5 space-y-1">
      {links.map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className={cn(
            "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors",
            light
              ? section === value
                ? "bg-brand-green-pale text-brand-green-dark"
                : "text-brand-navy hover:bg-slate-100"
              : section === value
                ? "bg-brand-green text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className="size-5" /> {label}
        </button>
      ))}
    </nav>
  );
}

function DashboardOverview({
  requests,
  customers,
  business,
  onOpenRequest,
  onNavigate,
  firebaseAuthenticated,
}: {
  requests: QuoteRequest[];
  customers: Customer[];
  business: DashboardBusiness;
  onOpenRequest: (id: string) => void;
  onNavigate: (section: DashboardSection) => void;
  firebaseAuthenticated: boolean;
}) {
  const counts = Object.fromEntries(
    statusOptions.map((option) => [
      option.value,
      requests.filter((request) => request.status === option.value).length,
    ]),
  ) as Record<QuoteRequestStatus, number>;
  const estimated = requests
    .filter((request) => request.status !== "cancelled")
    .reduce((total, request) => total + requestValue(request), 0);
  const upcoming = requests
    .flatMap((request) =>
      (request.followUps ?? [])
        .filter((item) => item.status === "pending")
        .map((item) => ({ ...item, request })),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 5);
  const recent = [...requests]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const activity = requests
    .flatMap((request) =>
      (request.activity ?? []).map((item) => ({ ...item, request })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
  return (
    <>
      <PageHeading
        eyebrow="Resumen del negocio"
        title="Resumen general"
        description="Prioridades, valor comercial y próximos pasos basados en tus solicitudes."
        action={
          <button
            type="button"
            onClick={() => onNavigate("requests")}
            className="button-secondary min-h-11 px-4"
          >
            Ver CRM <ChevronRight className="size-4" />
          </button>
        }
      />
      <MerchantOperationsSummary
        businessId={business.id}
        enabled={firebaseAuthenticated}
      />
      <section
        aria-label="Métricas del negocio"
        className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <MetricCard
          icon={ClipboardList}
          label="Solicitudes nuevas"
          value={String(counts.new)}
          helper={`${counts.in_review} en revisión`}
          tone="blue"
        />
        <MetricCard
          icon={MessageCircleMore}
          label="Cotizaciones pendientes"
          value={String(counts.quoted)}
          helper={`${counts.confirmed} confirmadas`}
          tone="violet"
        />
        <MetricCard
          icon={ShoppingBag}
          label="En preparación"
          value={String(counts.preparing)}
          helper={`${counts.completed} completadas`}
          tone="amber"
        />
        <MetricCard
          icon={UsersRound}
          label="Clientes"
          value={String(customers.length)}
          helper={`${business.productCount} productos activos`}
          tone="green"
        />
      </section>
      <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusMini label="En revisión" value={counts.in_review} />
        <StatusMini label="Confirmadas" value={counts.confirmed} />
        <StatusMini label="Completadas" value={counts.completed} />
        <article className="rounded-2xl border border-brand-green/20 bg-brand-navy p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-green-light">
            <CircleDollarSign className="size-4" /> Valor comercial
          </div>
          <p className="mt-2 text-xl font-black sm:text-2xl">
            {formatMoney(estimated)}
          </p>
          <p className="mt-1 text-[0.68rem] text-slate-300">
            Referencia y cotizaciones vigentes
          </p>
        </article>
      </section>
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Solicitudes recientes"
          description="Últimos movimientos del CRM"
          action={
            <button
              type="button"
              onClick={() => onNavigate("requests")}
              className="text-link"
            >
              Ver todas <ChevronRight className="size-4" />
            </button>
          }
        >
          <RequestCompactList requests={recent} onSelect={onOpenRequest} />
        </DashboardPanel>
        <DashboardPanel
          title="Próximos seguimientos"
          description="Compromisos pendientes"
        >
          <ul className="mt-5 space-y-3">
            {upcoming.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenRequest(item.request.id)}
                  className="flex w-full gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-brand-green/40 hover:bg-brand-green-pale/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand-blue">
                    <CalendarClock className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-brand-navy">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {item.request.customerName} ·{" "}
                      {formatDate(item.dueAt, true)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {!upcoming.length && (
              <EmptyCompact text="No hay seguimientos pendientes." />
            )}
          </ul>
        </DashboardPanel>
      </div>
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <DashboardPanel
          title="Distribución del pipeline"
          description="Solicitudes por etapa"
        >
          <div className="mt-5 space-y-3">
            {statusOptions
              .filter((option) => option.value !== "cancelled")
              .map((option) => {
                const count = counts[option.value];
                const max = Math.max(1, ...Object.values(counts));
                return (
                  <div
                    key={option.value}
                    className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-xs"
                  >
                    <span className="font-semibold text-slate-600">
                      {option.label}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-brand-green"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </span>
                    <span className="text-right font-black text-brand-navy">
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>
        </DashboardPanel>
        <DashboardPanel
          title="Actividad reciente"
          description="Cambios comerciales registrados"
        >
          <ol className="mt-5 space-y-4">
            {activity.map((item) => (
              <li key={`${item.request.id}-${item.id}`} className="flex gap-3">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-green ring-4 ring-brand-green-pale" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-brand-navy">
                    {item.description}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {item.request.customerName} ·{" "}
                    {formatDate(item.createdAt, true)}
                  </span>
                </span>
              </li>
            ))}
            {!activity.length && (
              <EmptyCompact text="La actividad aparecerá aquí." />
            )}
          </ol>
        </DashboardPanel>
      </div>
    </>
  );
}

function RequestsWorkspace({
  requests,
  customers,
  onOpenRequest,
  onCreate,
}: {
  requests: QuoteRequest[];
  customers: Customer[];
  onOpenRequest: (id: string) => void;
  onCreate: () => void;
}) {
  const [todayStart] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  });
  const [view, setView] = useState<RequestView>("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuoteRequestStatus | "all">("all");
  const [source, setSource] = useState<QuoteRequestSource | "all">("all");
  const [date, setDate] = useState<"all" | "today" | "7d" | "30d">("all");
  const [customerId, setCustomerId] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "value">("newest");
  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es-HN");
    const cutoff =
      date === "today"
        ? todayStart
        : date === "7d"
          ? todayStart - 6 * 86_400_000
          : date === "30d"
            ? todayStart - 29 * 86_400_000
            : 0;
    return requests
      .filter(
        (request) =>
          (status === "all" || request.status === status) &&
          (source === "all" || (request.source ?? "platform") === source) &&
          (customerId === "all" || request.customerId === customerId) &&
          new Date(request.createdAt).getTime() >= cutoff &&
          (!normalized ||
            [
              request.customerName,
              request.company,
              request.phone,
              requestReference(request),
            ].some((value) =>
              value?.toLocaleLowerCase("es-HN").includes(normalized),
            )),
      )
      .sort((a, b) =>
        sort === "oldest"
          ? a.createdAt.localeCompare(b.createdAt)
          : sort === "value"
            ? requestValue(b) - requestValue(a)
            : b.createdAt.localeCompare(a.createdAt),
      );
  }, [customerId, date, requests, search, sort, source, status, todayStart]);
  return (
    <>
      <PageHeading
        eyebrow="Gestión de oportunidades"
        title="Solicitudes comerciales"
        description="Consulta, prioriza y convierte solicitudes en cotizaciones reales."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="button-primary min-h-11 px-4"
          >
            <Plus className="size-4" /> Nueva solicitud
          </button>
        }
      />
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
              <ViewButton
                active={view === "list"}
                icon={List}
                label="Lista"
                onClick={() => setView("list")}
              />
              <ViewButton
                active={view === "pipeline"}
                icon={Columns3}
                label="Pipeline"
                onClick={() => setView("pipeline")}
              />
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {filtered.length} de {requests.length} solicitudes
            </p>
          </div>
          <div className="mt-4 grid gap-3 min-[1400px]:grid-cols-[minmax(14rem,1fr)_10rem_10rem_9rem_12rem_10rem] sm:grid-cols-2">
            <label className="relative sm:col-span-2 xl:col-span-1">
              <span className="sr-only">Buscar solicitudes</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, teléfono, referencia o empresa"
                className="min-h-11 w-full rounded-xl border border-slate-300 pr-3 pl-10 text-sm"
              />
            </label>
            <FilterSelect
              label="Filtrar por estado"
              value={status}
              onChange={(value) => setStatus(value as typeof status)}
              options={[
                { value: "all", label: "Todos los estados" },
                ...statusOptions,
              ]}
            />
            <FilterSelect
              label="Filtrar por origen"
              value={source}
              onChange={(value) => setSource(value as typeof source)}
              options={[
                { value: "all", label: "Todos los orígenes" },
                ...Object.entries(sourceLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <FilterSelect
              label="Filtrar por fecha"
              value={date}
              onChange={(value) => setDate(value as typeof date)}
              options={[
                { value: "all", label: "Cualquier fecha" },
                { value: "today", label: "Hoy" },
                { value: "7d", label: "Últimos 7 días" },
                { value: "30d", label: "Últimos 30 días" },
              ]}
            />
            <FilterSelect
              label="Filtrar por cliente"
              value={customerId}
              onChange={setCustomerId}
              options={[
                { value: "all", label: "Todos los clientes" },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })),
              ]}
            />
            <FilterSelect
              label="Ordenar solicitudes"
              value={sort}
              onChange={(value) => setSort(value as typeof sort)}
              options={[
                { value: "newest", label: "Más recientes" },
                { value: "oldest", label: "Más antiguas" },
                { value: "value", label: "Mayor valor" },
              ]}
            />
          </div>
        </div>
        {view === "list" ? (
          <RequestList requests={filtered} onSelect={onOpenRequest} />
        ) : (
          <Pipeline requests={filtered} onSelect={onOpenRequest} />
        )}
      </section>
    </>
  );
}

function CustomersWorkspace({
  customers,
  requests,
  onOpenCustomer,
}: {
  customers: Customer[];
  requests: QuoteRequest[];
  onOpenCustomer: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const normalized = search.trim().toLocaleLowerCase("es-HN");
  const filtered = customers.filter(
    (customer) =>
      !normalized ||
      [customer.name, customer.company, customer.phone].some((value) =>
        value?.toLocaleLowerCase("es-HN").includes(normalized),
      ),
  );
  return (
    <>
      <PageHeading
        eyebrow="Relaciones comerciales"
        title="Clientes"
        description="Historial, productos consultados y próximos pasos por cliente."
      />
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-black text-brand-navy">
              Directorio de clientes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {customers.length} clientes de este comercio
            </p>
          </div>
          <label className="relative block sm:w-80">
            <span className="sr-only">Buscar clientes</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, empresa o teléfono"
              className="min-h-11 w-full rounded-xl border border-slate-300 pr-3 pl-10 text-sm"
            />
          </label>
        </div>
        <div className="hidden grid-cols-[minmax(14rem,1.2fr)_minmax(10rem,1fr)_8rem_8rem_9rem_3rem] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase xl:grid">
          <span>Cliente</span>
          <span>Contacto</span>
          <span>Solicitudes</span>
          <span>Completadas</span>
          <span>Última interacción</span>
          <span />
        </div>
        <ul className="divide-y divide-slate-100">
          {filtered.map((customer) => {
            const customerRequests = requests.filter(
              (request) => request.customerId === customer.id,
            );
            const completed = customerRequests.filter(
              (request) => request.status === "completed",
            ).length;
            const last = [...customerRequests].sort((a, b) =>
              b.updatedAt.localeCompare(a.updatedAt),
            )[0];
            return (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => onOpenCustomer(customer.id)}
                  className="grid min-h-20 w-full gap-3 px-4 py-4 text-left hover:bg-slate-50 xl:grid-cols-[minmax(14rem,1.2fr)_minmax(10rem,1fr)_8rem_8rem_9rem_3rem] xl:items-center xl:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold text-brand-navy">
                      {customer.name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {customer.company ?? customerTypeLabels[customer.type]}
                    </span>
                  </span>
                  <span className="text-sm text-slate-600">
                    <span className="block">{customer.phone}</span>
                    <span className="text-xs text-brand-green-dark">
                      {customer.whatsapp
                        ? "WhatsApp disponible"
                        : "Contacto telefónico"}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-brand-navy">
                    <span className="mr-1 text-xs text-slate-500 md:hidden">
                      Solicitudes:
                    </span>
                    {customerRequests.length}
                  </span>
                  <span className="text-sm font-bold text-brand-navy">
                    <span className="mr-1 text-xs text-slate-500 md:hidden">
                      Completadas:
                    </span>
                    {completed}
                  </span>
                  <span className="text-sm text-slate-500">
                    {last
                      ? formatDate(last.updatedAt)
                      : formatDate(customer.updatedAt)}
                  </span>
                  <ChevronRight className="hidden size-5 text-slate-300 md:block" />
                </button>
              </li>
            );
          })}
          {!filtered.length && (
            <li>
              <EmptyState
                title="No hay clientes con esta búsqueda"
                description="Prueba con otro nombre, empresa o teléfono."
                icon={UsersRound}
              />
            </li>
          )}
        </ul>
      </section>
    </>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-bold text-brand-green-dark">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  helper: string;
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
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-xs font-semibold text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-brand-navy sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-[0.7rem] font-semibold text-brand-green-dark">
        {helper}
      </p>
    </article>
  );
}
function StatusMini({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-brand-navy">{value}</p>
    </article>
  );
}
function DashboardPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-black text-brand-navy">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
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

function RequestCompactList({
  requests,
  onSelect,
}: {
  requests: QuoteRequest[];
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="mt-5 divide-y divide-slate-100">
      {requests.map((request) => (
        <li key={request.id}>
          <button
            type="button"
            onClick={() => onSelect(request.id)}
            aria-label={`${request.customerName}, ${requestReference(request)}`}
            className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-3 py-3 text-left hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-brand-navy">
                {request.customerName}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {requestReference(request)} · {formatDate(request.createdAt)}
              </span>
            </span>
            <span className="text-right">
              <StatusBadge status={request.status} />
              <span className="mt-1 block text-xs font-bold text-brand-navy">
                {formatMoney(requestValue(request))}
              </span>
            </span>
          </button>
        </li>
      ))}
      {!requests.length && <EmptyCompact text="Aún no hay solicitudes." />}
    </ul>
  );
}

function RequestList({
  requests,
  onSelect,
}: {
  requests: QuoteRequest[];
  onSelect: (id: string) => void;
}) {
  if (!requests.length)
    return (
      <EmptyState
        title="No hay solicitudes con estos filtros"
        description="Prueba otra búsqueda o crea una solicitud manual."
        icon={ClipboardList}
      />
    );
  return (
    <div>
      <div className="hidden grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.8fr)_7rem_8rem_8rem_7rem] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase xl:grid">
        <span>Cliente</span>
        <span>Productos</span>
        <span>Origen</span>
        <span>Estado</span>
        <span>Valor</span>
        <span className="text-right">Actualizada</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {requests.map((request) => (
          <li key={request.id}>
            <button
              type="button"
              onClick={() => onSelect(request.id)}
              aria-label={`${request.customerName}, ${requestReference(request)}`}
              className="grid min-h-24 w-full gap-3 px-4 py-4 text-left hover:bg-slate-50 xl:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.8fr)_7rem_8rem_8rem_7rem] xl:items-center xl:px-5"
            >
              <span className="min-w-0">
                <span className="block truncate font-extrabold text-brand-navy">
                  {request.customerName}
                </span>
                <span className="mt-1 block text-xs font-bold text-brand-green-dark">
                  {requestReference(request)}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500 xl:hidden">
                  {request.company ?? request.phone}
                </span>
              </span>
              <span className="truncate text-sm text-slate-600">
                {request.items[0]?.productName ?? "Sin producto"}
                {request.items.length > 1
                  ? ` +${request.items.length - 1}`
                  : ""}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {sourceLabels[request.source ?? "platform"]}
              </span>
              <span>
                <StatusBadge status={request.status} />
              </span>
              <span className="text-sm font-black text-brand-navy">
                {formatMoney(requestValue(request))}
              </span>
              <span className="text-sm text-slate-500 xl:text-right">
                {formatDate(request.updatedAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pipeline({
  requests,
  onSelect,
}: {
  requests: QuoteRequest[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto overscroll-x-contain p-4 sm:p-5">
      <div className="grid min-w-0 gap-4 md:auto-cols-[18rem] md:grid-flow-col">
        {statusOptions.map((column) => {
          const items = requests.filter(
            (request) => request.status === column.value,
          );
          return (
            <section
              key={column.value}
              className="min-w-0 rounded-2xl bg-slate-50 p-3 md:w-72"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-brand-navy">
                  {column.label}
                </h3>
                <span className="grid size-7 place-items-center rounded-full bg-white text-xs font-black text-slate-600 shadow-sm">
                  {items.length}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {items.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => onSelect(request.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-md"
                  >
                    <p className="text-[0.65rem] font-extrabold tracking-wide text-brand-green-dark">
                      {requestReference(request)}
                    </p>
                    <p className="mt-1 truncate text-sm font-extrabold text-brand-navy">
                      {request.customerName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {request.company ??
                        sourceLabels[request.source ?? "platform"]}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        {request.items.length} prod.
                      </span>
                      <span className="text-sm font-black text-brand-navy">
                        {formatMoney(requestValue(request))}
                      </span>
                    </div>
                  </button>
                ))}
                {!items.length && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                    Sin solicitudes
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function ViewButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof List;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold",
        active ? "bg-white text-brand-navy shadow-sm" : "text-slate-500",
      )}
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}
function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof ClipboardList;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <Icon className="mx-auto size-9 text-slate-300" />
      <p className="mt-3 font-bold text-brand-navy">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
function EmptyCompact({ text }: { text: string }) {
  return <li className="py-8 text-center text-sm text-slate-500">{text}</li>;
}
function MobileNavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-[0.65rem] font-bold",
        active ? "text-brand-green-dark" : "text-slate-500",
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
