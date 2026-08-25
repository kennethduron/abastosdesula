"use client";

import {
  Check,
  Clock3,
  Copy,
  LoaderCircle,
  Plus,
  ShieldX,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AccessApplication {
  id: string;
  responsibleName: string;
  businessName: string;
  email: string;
  phone: string;
  categoryId: string;
  stall: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const categoryNames: Record<string, string> = {
  "category-fruits": "Frutas",
  "category-vegetables": "Verduras",
  "category-grains": "Granos",
  "category-dairy": "Lácteos",
  "category-groceries": "Abarrotes",
};

export function MerchantAccessSection({
  enabled,
  readOnly,
}: {
  enabled: boolean;
  readOnly: boolean;
}) {
  const [applications, setApplications] = useState<AccessApplication[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!enabled) return;
    const response = await fetch("/api/admin/merchant-applications", {
      cache: "no-store",
    });
    if (!response.ok) {
      setError("No fue posible cargar las solicitudes.");
      setLoading(false);
      return;
    }
    const result = (await response.json()) as {
      applications: AccessApplication[];
    };
    setApplications(result.applications);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void fetch("/api/admin/merchant-applications", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("request-failed");
        return (await response.json()) as {
          applications: AccessApplication[];
        };
      })
      .then((result) => {
        setApplications(result.applications);
        setLoading(false);
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
        setError("No fue posible cargar las solicitudes.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [enabled]);

  async function decide(
    applicationId: string,
    decision: "approved" | "rejected",
  ) {
    setActing(applicationId);
    setError(null);
    const response = await fetch("/api/admin/merchant-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, decision }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      setError(result.error ?? "No fue posible actualizar la solicitud.");
    else await load();
    setActing(null);
  }

  return (
    <section
      id="solicitudes-acceso"
      className="mt-6 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-brand-navy">
            Solicitudes de acceso
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisa nuevos comerciantes antes de habilitar su operación.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="button-primary min-h-11"
          >
            <Plus className="size-4" /> Crear acceso
          </button>
        )}
      </div>

      {showCreate && !readOnly && (
        <form
          className="grid gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 xl:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setTemporaryPassword(null);
            const form = event.currentTarget;
            const data = new FormData(form);
            const response = await fetch("/api/admin/merchants", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                responsibleName: data.get("responsibleName"),
                email: data.get("email"),
                phone: data.get("phone"),
                whatsapp: data.get("phone"),
                businessName: data.get("businessName"),
                categoryId: data.get("categoryId"),
                stall: data.get("stall"),
                initialStatus: "active",
              }),
            });
            const result = (await response.json()) as {
              error?: string;
              temporaryPassword?: string;
            };
            if (!response.ok)
              setError(result.error ?? "No fue posible crear el acceso.");
            else {
              setTemporaryPassword(result.temporaryPassword ?? null);
              form.reset();
            }
          }}
        >
          {[
            ["responsibleName", "Responsable", "text"],
            ["email", "Correo", "email"],
            ["phone", "Teléfono", "tel"],
            ["businessName", "Negocio", "text"],
            ["stall", "Local / puesto", "text"],
          ].map(([name, label, type]) => (
            <label key={name} className="text-xs font-bold text-brand-navy">
              {label}
              <input
                name={name}
                type={type}
                required={name !== "stall"}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </label>
          ))}
          <label className="text-xs font-bold text-brand-navy">
            Categoría
            <select
              name="categoryId"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              {Object.entries(categoryNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button-primary self-end">
            <UserPlus className="size-4" /> Generar cuenta
          </button>
          {temporaryPassword && (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:col-span-2 xl:col-span-4"
            >
              <strong>Contraseña temporal (se muestra una sola vez):</strong>
              <span className="mt-2 flex flex-wrap items-center gap-2 font-mono font-bold">
                {temporaryPassword}
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(temporaryPassword)
                  }
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-amber-300 px-3 font-sans text-xs"
                >
                  <Copy className="size-3.5" /> Copiar
                </button>
              </span>
              <span className="mt-2 block text-xs">
                El comerciante deberá reemplazarla al iniciar sesión.
              </span>
            </div>
          )}
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p className="flex items-center gap-2 p-6 text-sm text-slate-500">
          <LoaderCircle className="size-4 animate-spin" /> Cargando solicitudes…
        </p>
      ) : applications.length ? (
        <ul className="divide-y divide-slate-100">
          {applications.map((application) => (
            <li
              key={application.id}
              className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"
            >
              <div>
                <p className="font-extrabold text-brand-navy">
                  {application.businessName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {application.responsibleName} ·{" "}
                  {categoryNames[application.categoryId] ??
                    application.categoryId}
                </p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-700">
                  {application.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {application.phone}
                  {application.stall ? ` · ${application.stall}` : ""}
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {application.createdAt
                  ? new Intl.DateTimeFormat("es-HN", {
                      dateStyle: "medium",
                    }).format(new Date(application.createdAt))
                  : "Fecha pendiente"}
              </p>
              {application.status === "pending" && !readOnly ? (
                <div className="flex gap-2">
                  <button
                    disabled={acting === application.id}
                    onClick={() => void decide(application.id, "approved")}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand-green px-3 text-xs font-bold text-white"
                  >
                    <Check className="size-4" /> Aprobar
                  </button>
                  <button
                    disabled={acting === application.id}
                    onClick={() => void decide(application.id, "rejected")}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-700"
                  >
                    <ShieldX className="size-4" /> Rechazar
                  </button>
                </div>
              ) : (
                <span
                  className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${application.status === "approved" ? "bg-emerald-50 text-emerald-700" : application.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}
                >
                  <Clock3 className="size-3.5" />{" "}
                  {application.status === "approved"
                    ? "Aprobada"
                    : application.status === "rejected"
                      ? "Rechazada"
                      : "Pendiente"}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-6 text-sm text-slate-500">
          No hay solicitudes registradas.
        </p>
      )}
    </section>
  );
}
