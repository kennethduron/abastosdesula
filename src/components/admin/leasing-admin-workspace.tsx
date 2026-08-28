"use client";

import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  Plus,
  Save,
  Search,
  Store,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type {
  CommercialSpace,
  LeasingActivity,
  LeasingInquiry,
  LeasingInquiryStatus,
  UserRole,
} from "@/domain";
import { LEASING_STATUS_LABELS } from "@/domain";
import { cn } from "@/lib/utils";

const pipeline = [
  { key: "new", label: "Nuevas", statuses: ["new"] },
  { key: "contacted", label: "Por contactar", statuses: ["contacted"] },
  {
    key: "visits",
    label: "Visitas programadas",
    statuses: ["visit_scheduled"],
  },
  { key: "proposals", label: "Propuestas", statuses: ["proposal_sent"] },
  { key: "negotiating", label: "Negociación", statuses: ["negotiating"] },
  {
    key: "closed",
    label: "Cerradas",
    statuses: ["approved", "closed", "not_interested"],
  },
] as const;

export function LeasingAdminWorkspace({
  spaces: initialSpaces,
  inquiries: initialInquiries,
  unreadCount,
  role,
  localFallback = false,
}: {
  spaces: CommercialSpace[];
  inquiries: LeasingInquiry[];
  unreadCount: number;
  role: Extract<UserRole, "institutional_admin" | "presentation_viewer">;
  localFallback?: boolean;
}) {
  const [spaces] = useState(initialSpaces);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [selectedId, setSelectedId] = useState(initialInquiries[0]?.id ?? "");
  const [tab, setTab] = useState<"pipeline" | "list" | "spaces">("pipeline");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [storageRevision, setStorageRevision] = useState(0);
  const selected = inquiries.find((item) => item.id === selectedId);
  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return term
      ? inquiries.filter((item) =>
          [
            item.reference,
            item.customerName,
            item.company,
            item.commercialSpaceTitle,
            item.businessType,
          ]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(term),
        )
      : inquiries;
  }, [inquiries, query]);
  const active = inquiries.filter(
    (item) => !["closed", "not_interested"].includes(item.status),
  ).length;
  const pendingVisits = inquiries.filter(
    (item) => item.status === "visit_scheduled",
  ).length;
  const readOnly = role === "presentation_viewer";

  useEffect(() => {
    if (!localFallback) return;
    const stored = window.localStorage.getItem("abastos-leasing-audit");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as LeasingInquiry[];
      if (Array.isArray(parsed) && parsed.length) {
        const frame = window.requestAnimationFrame(() => {
          setInquiries(parsed);
          setSelectedId(parsed[0].id);
          setStorageRevision(1);
        });
        return () => window.cancelAnimationFrame(frame);
      }
    } catch {
      window.localStorage.removeItem("abastos-leasing-audit");
    }
  }, [localFallback]);

  async function saveInquiry(
    update: Partial<LeasingInquiry> & { id: string; note?: string },
  ) {
    if (!localFallback) {
      const response = await fetch("/api/admin/leasing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "inquiry",
          inquiryId: update.id,
          status: update.status,
          note: update.note,
          nextAction: update.nextAction,
          followUpAt: update.followUpAt,
        }),
      });
      if (!response.ok)
        throw new Error("No fue posible guardar el seguimiento.");
    }
    setInquiries((items) => {
      const next = items.map((item) =>
        item.id === update.id
          ? {
              ...item,
              ...update,
              internalNotes: update.note
                ? [
                    ...item.internalNotes,
                    {
                      id: crypto.randomUUID(),
                      body: update.note,
                      createdAt: new Date().toISOString(),
                      createdBy: "Administración",
                    },
                  ]
                : item.internalNotes,
              activity: [
                {
                  id: crypto.randomUUID(),
                  inquiryId: item.id,
                  type: update.note
                    ? "note_added"
                    : update.followUpAt
                      ? "follow_up_scheduled"
                      : ("status_changed" as LeasingActivity["type"]),
                  description: update.note
                    ? "Nota interna agregada"
                    : update.followUpAt
                      ? "Seguimiento programado"
                      : "Estado actualizado",
                  createdAt: new Date().toISOString(),
                  createdBy: "Administración",
                },
                ...item.activity,
              ],
            }
          : item,
      );
      if (localFallback)
        window.localStorage.setItem(
          "abastos-leasing-audit",
          JSON.stringify(next),
        );
      return next;
    });
  }

  async function saveSpace(input: Record<string, unknown>) {
    const method = input.id ? "PATCH" : "POST";
    const response = await fetch("/api/admin/leasing", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...(method === "PATCH" ? { kind: "space" } : {}),
        ...input,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        typeof body.error === "string"
          ? body.error
          : "No fue posible guardar el espacio.",
      );
    location.reload();
  }

  return (
    <main className="min-h-dvh max-w-full overflow-x-clip bg-[#f5f7fa] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-17 max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"
            aria-label="Volver a administración"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-black text-brand-navy">
              Solicitudes de locales
            </p>
            <p className="text-xs text-slate-500">
              CRM institucional de arrendamientos
            </p>
          </div>
          {!readOnly && (
            <span className="relative grid size-10 place-items-center rounded-full bg-blue-50 text-brand-blue">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
          <Link
            href="/locales"
            target="_blank"
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-brand-navy sm:inline-flex"
          >
            Ver sitio público <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-brand-blue">
              Gestión institucional
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">
              Arrendamientos comerciales
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Seguimiento de interesados y administración de espacios dentro de
              Central de Abastos de Sula.
            </p>
          </div>
          {readOnly && (
            <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Vista agregada · sin datos personales
            </span>
          )}
        </div>
        <section
          aria-label="Métricas de arrendamientos"
          className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5"
        >
          <Metric
            icon={ClipboardList}
            label="Nuevas"
            value={inquiries.filter((item) => item.status === "new").length}
          />
          <Metric
            icon={Store}
            label="Publicados"
            value={spaces.filter((space) => space.published).length}
          />
          <Metric
            icon={CheckCircle2}
            label="Disponibles"
            value={
              spaces.filter((space) => space.availabilityStatus === "available")
                .length
            }
          />
          <Metric icon={CalendarClock} label="Visitas" value={pendingVisits} />
          <Metric
            icon={Building2}
            label="Oportunidades"
            value={active}
            className="col-span-2 lg:col-span-1"
          />
        </section>
        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <Tab
            active={tab === "pipeline"}
            onClick={() => setTab("pipeline")}
            icon={LayoutGrid}
          >
            Pipeline
          </Tab>
          <Tab
            active={tab === "list"}
            onClick={() => setTab("list")}
            icon={List}
          >
            Lista
          </Tab>
          <Tab
            active={tab === "spaces"}
            onClick={() => setTab("spaces")}
            icon={Store}
          >
            Locales
          </Tab>
          {!readOnly && tab === "spaces" && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white"
            >
              <Plus className="size-4" />
              Crear espacio
            </button>
          )}
        </div>
        {readOnly && tab !== "spaces" ? (
          <PrivacyNotice />
        ) : tab === "spaces" ? (
          <section className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {spaces.map((space) => (
                <SpaceEditor
                  key={space.id}
                  space={space}
                  readOnly={readOnly}
                  onSave={saveSpace}
                />
              ))}
            </div>
            {creating && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy/60 p-4 backdrop-blur-sm">
                <div className="mx-auto max-w-2xl rounded-3xl bg-white p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-brand-navy">
                      Crear espacio
                    </h2>
                    <button
                      onClick={() => setCreating(false)}
                      className="grid size-10 place-items-center rounded-xl hover:bg-slate-100"
                    >
                      <X />
                    </button>
                  </div>
                  <SpaceEditor onSave={saveSpace} />
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0">
              <label className="relative block">
                <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por referencia, interesado, empresa o local"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pr-4 pl-11 text-sm outline-none focus:border-brand-blue"
                />
              </label>
              {tab === "pipeline" ? (
                <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {pipeline.map((column) => (
                    <div
                      key={column.key}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-slate-100/70 p-3"
                    >
                      <h2 className="flex items-center justify-between text-sm font-black text-brand-navy">
                        {column.label}
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs">
                          {
                            visible.filter((item) =>
                              (column.statuses as readonly string[]).includes(
                                item.status,
                              ),
                            ).length
                          }
                        </span>
                      </h2>
                      <div className="mt-3 space-y-3">
                        {visible
                          .filter((item) =>
                            (column.statuses as readonly string[]).includes(
                              item.status,
                            ),
                          )
                          .map((item) => (
                            <InquiryCard
                              key={item.id}
                              inquiry={item}
                              active={item.id === selectedId}
                              onClick={() => setSelectedId(item.id)}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {visible.map((item) => (
                    <InquiryCard
                      key={item.id}
                      inquiry={item}
                      active={item.id === selectedId}
                      onClick={() => setSelectedId(item.id)}
                      wide
                    />
                  ))}
                </div>
              )}
              {!visible.length && (
                <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  Las nuevas solicitudes aparecerán aquí.
                </p>
              )}
            </section>
            <aside className="min-w-0">
              {selected ? (
                <InquiryDetail
                  key={`${selected.id}:${storageRevision}`}
                  inquiry={selected}
                  space={spaces.find(
                    (space) => space.id === selected.commercialSpaceId,
                  )}
                  onSave={saveInquiry}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  Selecciona una solicitud para revisar su detalle.
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Store;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <Icon className="size-5 text-brand-green" />
      <p className="mt-3 text-2xl font-black text-brand-navy">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </article>
  );
}
function Tab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick(): void;
  icon: typeof List;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold",
        active
          ? "bg-brand-navy text-white"
          : "text-slate-600 hover:bg-slate-50",
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}
function PrivacyNotice() {
  return (
    <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
      <UserRound className="mx-auto size-10 text-amber-700" />
      <h2 className="mt-4 text-xl font-black text-brand-navy">
        Información personal restringida
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        La vista de presentación puede consultar métricas agregadas y el
        catálogo de espacios, pero no nombres, teléfonos, correos ni detalles de
        solicitudes.
      </p>
    </section>
  );
}

function InquiryCard({
  inquiry,
  active,
  onClick,
  wide,
}: {
  inquiry: LeasingInquiry;
  active: boolean;
  onClick(): void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full min-w-0 rounded-xl border bg-white p-4 text-left shadow-sm",
        active
          ? "border-brand-blue ring-2 ring-brand-blue/10"
          : "border-slate-200 hover:border-brand-green/40",
        wide && "sm:flex sm:items-center sm:justify-between sm:gap-5",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-black text-brand-blue">
          {inquiry.reference}
        </p>
        <p className="mt-1 truncate font-black text-brand-navy">
          {inquiry.customerName}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {inquiry.company || inquiry.businessType}
        </p>
      </div>
      <div className={cn("mt-3", wide && "sm:mt-0 sm:text-right")}>
        <p className="truncate text-xs font-semibold text-slate-600">
          {inquiry.commercialSpaceTitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {inquiry.createdAt
            ? new Intl.DateTimeFormat("es-HN", { dateStyle: "medium" }).format(
                new Date(inquiry.createdAt),
              )
            : "Reciente"}
        </p>
      </div>
    </button>
  );
}

function InquiryDetail({
  inquiry,
  space,
  onSave,
}: {
  inquiry: LeasingInquiry;
  space?: CommercialSpace;
  onSave(
    update: Partial<LeasingInquiry> & { id: string; note?: string },
  ): Promise<void>;
}) {
  const [status, setStatus] = useState(inquiry.status);
  const [note, setNote] = useState("");
  const [nextAction, setNextAction] = useState(inquiry.nextAction ?? "");
  const [followUpAt, setFollowUpAt] = useState(
    inquiry.followUpAt?.slice(0, 16) ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const whatsapp = (inquiry.whatsapp || inquiry.phone).replace(/\D/g, "");
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      await onSave({ id: inquiry.id, status, note, nextAction, followUpAt });
      setNote("");
      setMessage("Seguimiento guardado.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No fue posible guardar.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-24">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black text-brand-blue">
          {inquiry.reference}
        </p>
        <h2 className="mt-1 text-xl font-black text-brand-navy">
          Detalle de solicitud
        </h2>
      </div>
      {space && (
        <div className="flex gap-3 border-b border-slate-100 p-5">
          <div className="relative size-18 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={space.coverImage.src}
              alt=""
              fill
              sizes="72px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-black text-brand-navy">{space.title}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="size-3" />
              {space.locationLabel}
            </p>
          </div>
        </div>
      )}
      <div className="space-y-5 p-5">
        <DetailGroup title="Interesado">
          <p className="font-black text-brand-navy">{inquiry.customerName}</p>
          <p>
            {inquiry.phone}
            {inquiry.email ? ` · ${inquiry.email}` : ""}
          </p>
          <p>{inquiry.company || "Sin empresa indicada"}</p>
        </DetailGroup>
        <DetailGroup title="Solicitud">
          <p>
            <b>Tipo:</b> {inquiry.businessType}
          </p>
          <p>
            <b>Uso:</b> {inquiry.intendedUse}
          </p>
          {inquiry.requestedStartDate && (
            <p>
              <b>Fecha esperada:</b> {inquiry.requestedStartDate}
            </p>
          )}
          {inquiry.notes && (
            <p>
              <b>Comentarios:</b> {inquiry.notes}
            </p>
          )}
        </DetailGroup>
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola ${inquiry.customerName}, le saluda el equipo administrativo de Central de Abastos de Sula. Damos seguimiento a su solicitud ${inquiry.reference} sobre ${inquiry.commercialSpaceTitle}.`)}`}
          target="_blank"
          rel="noreferrer"
          className="button-whatsapp w-full"
        >
          <MessageCircle className="size-4" />
          Contactar por WhatsApp
        </a>
        <div className="border-t border-slate-100 pt-5">
          <label className="text-xs font-bold text-slate-600">
            Estado
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as LeasingInquiryStatus)
              }
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-semibold text-brand-navy"
            >
              {Object.entries(LEASING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-600">
            Nota interna
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-600">
            Próxima acción
            <input
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-bold text-slate-600">
            Programar seguimiento
            <input
              type="datetime-local"
              value={followUpAt}
              onChange={(event) => setFollowUpAt(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="button-primary mt-4 w-full"
          >
            <Save className="size-4" />
            {saving ? "Guardando" : "Guardar seguimiento"}
          </button>
          {message && (
            <p className="mt-2 text-center text-xs font-semibold text-slate-600">
              {message}
            </p>
          )}
        </div>
        {inquiry.internalNotes.length > 0 && (
          <DetailGroup title="Historial de notas">
            {inquiry.internalNotes.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                <p>{item.body}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("es-HN")
                    : ""}
                </p>
              </div>
            ))}
          </DetailGroup>
        )}
        <DetailGroup title="Línea de tiempo">
          <ol className="space-y-3">
            {inquiry.activity.map((item) => (
              <li
                key={item.id}
                className="relative border-l-2 border-brand-green/25 pl-4"
              >
                <span className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-brand-green" />
                <p className="font-semibold text-brand-navy">
                  {item.description}
                </p>
                <p className="text-[11px] text-slate-400">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("es-HN")
                    : "Reciente"}
                </p>
              </li>
            ))}
          </ol>
        </DetailGroup>
      </div>
    </div>
  );
}
function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="text-sm leading-6 text-slate-600">
      <h3 className="mb-2 text-xs font-black tracking-wider text-brand-green uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SpaceEditor({
  space,
  readOnly = false,
  onSave,
}: {
  space?: CommercialSpace;
  readOnly?: boolean;
  onSave(input: Record<string, unknown>): Promise<void>;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const input = {
      ...(space ? { id: space.id } : {}),
      title: form.get("title"),
      slug: form.get("slug"),
      shortDescription: form.get("shortDescription"),
      description: form.get("description"),
      type: form.get("type"),
      locationLabel: form.get("locationLabel"),
      approximateArea: form.get("approximateArea"),
      availabilityStatus: form.get("availabilityStatus"),
      priceVisibility: "consult",
      features: String(form.get("features"))
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      suitableFor: String(form.get("suitableFor"))
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      coverImageSrc: form.get("coverImageSrc"),
      published: form.get("published") === "on",
      featured: form.get("featured") === "on",
    };
    try {
      await onSave(input);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No fue posible guardar.",
      );
      setSaving(false);
    }
  }
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {space && (
        <div className="relative aspect-[16/8]">
          <Image
            src={space.coverImage.src}
            alt={space.coverImage.alt}
            fill
            sizes="420px"
            className="object-cover"
          />
        </div>
      )}
      <form onSubmit={submit} className="grid gap-3 p-4">
        <input
          name="title"
          required
          defaultValue={space?.title}
          placeholder="Título"
          disabled={readOnly}
          className="min-h-10 rounded-xl border border-slate-200 px-3 font-bold text-brand-navy"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="slug"
            required
            defaultValue={space?.slug}
            placeholder="slug-del-espacio"
            disabled={readOnly}
            className="min-h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <select
            name="availabilityStatus"
            defaultValue={space?.availabilityStatus ?? "available"}
            disabled={readOnly}
            className="min-h-10 min-w-0 rounded-xl border border-slate-200 px-2 text-sm"
          >
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="unavailable">No disponible</option>
          </select>
        </div>
        <input
          name="shortDescription"
          required
          defaultValue={space?.shortDescription}
          placeholder="Descripción breve"
          disabled={readOnly}
          className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <textarea
          name="description"
          required
          defaultValue={space?.description}
          placeholder="Descripción completa"
          disabled={readOnly}
          rows={3}
          className="rounded-xl border border-slate-200 p-3 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="type"
            required
            defaultValue={space?.type}
            placeholder="Tipo"
            disabled={readOnly}
            className="min-h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <input
            name="approximateArea"
            required
            defaultValue={space?.approximateArea}
            placeholder="Área aproximada"
            disabled={readOnly}
            className="min-h-10 min-w-0 rounded-xl border border-slate-200 px-3 text-sm"
          />
        </div>
        <input
          name="locationLabel"
          required
          defaultValue={space?.locationLabel}
          placeholder="Ubicación descriptiva"
          disabled={readOnly}
          className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="features"
          required
          defaultValue={space?.features.join(", ")}
          placeholder="Características separadas por coma"
          disabled={readOnly}
          className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <input
          name="suitableFor"
          required
          defaultValue={space?.suitableFor.join(", ")}
          placeholder="Usos separados por coma"
          disabled={readOnly}
          className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm"
        />
        <select
          name="coverImageSrc"
          defaultValue={
            space?.coverImage.src ??
            "/images/spaces/local-comercial-amplio.webp"
          }
          disabled={readOnly}
          className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm"
        >
          <option value="/images/spaces/local-comercial-amplio.webp">
            Imagen local amplio
          </option>
          <option value="/images/spaces/espacio-distribucion.webp">
            Imagen distribución
          </option>
          <option value="/images/spaces/local-alimentos.webp">
            Imagen alimentos
          </option>
          <option value="/images/spaces/espacio-productos-frescos.webp">
            Imagen productos frescos
          </option>
          <option value="/images/spaces/local-comercial-compacto.webp">
            Imagen local compacto
          </option>
        </select>
        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={space?.published ?? true}
              disabled={readOnly}
            />
            Publicado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={space?.featured}
              disabled={readOnly}
            />
            Destacado
          </label>
        </div>
        {!readOnly && (
          <button
            type="submit"
            disabled={saving}
            className="button-primary w-full"
          >
            <Save className="size-4" />
            {saving ? "Guardando" : space ? "Guardar cambios" : "Crear espacio"}
          </button>
        )}
        {error && (
          <p className="text-xs font-semibold text-rose-600">{error}</p>
        )}
      </form>
    </article>
  );
}
