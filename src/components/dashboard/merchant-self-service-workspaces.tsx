"use client";

import {
  Archive,
  Boxes,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";

import { getFirebaseDb } from "@/data/adapters/firebase/firestore-client";
import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import {
  businessProfileSchema,
  inventoryMovementSchema,
  merchantProductSchema,
} from "@/domain";

const categories = [
  ["category-fruits", "Frutas"],
  ["category-vegetables", "Verduras"],
  ["category-grains", "Granos"],
  ["category-dairy", "Lácteos"],
  ["category-groceries", "Abarrotes"],
] as const;

interface LiveProduct {
  id: string;
  businessId: string;
  name: string;
  description: string;
  categoryId: string;
  image: string;
  unit: string;
  priceMinor: number;
  sku: string;
  stock: number;
  minimumStock: number;
  published: boolean;
  status: "active" | "inactive";
}

function productFromDoc(id: string, data: DocumentData): LiveProduct {
  return {
    id,
    businessId: String(data.businessId ?? ""),
    name: String(data.name ?? "Producto"),
    description: String(data.description ?? ""),
    categoryId: String(data.categoryId ?? "category-groceries"),
    image: String(data.image ?? "/images/home/hero-market.webp"),
    unit: String(data.unit ?? "unidad"),
    priceMinor: Number(
      data.priceMinor ?? data.referencePrice?.amountMinor ?? 0,
    ),
    sku: String(data.sku ?? ""),
    stock: Math.max(0, Number(data.stock ?? 0)),
    minimumStock: Math.max(0, Number(data.minimumStock ?? 0)),
    published: data.published === true || !("published" in data),
    status: data.status === "inactive" ? "inactive" : "active",
  };
}

function useMerchantOperations(businessId: string, enabled: boolean) {
  const [business, setBusiness] = useState<DocumentData | null>(null);
  const [merchantDocumentId, setMerchantDocumentId] = useState(businessId);
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const db = getFirebaseDb();
    const unsubscribeBusiness = onSnapshot(
      doc(db, "businesses", businessId),
      (snapshot) => setBusiness(snapshot.exists() ? snapshot.data() : null),
      () => setError("No fue posible cargar la información del negocio."),
    );
    const unsubscribeProducts = onSnapshot(
      query(collection(db, "products"), where("businessId", "==", businessId)),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((item) => productFromDoc(item.id, item.data())),
        );
        setLoading(false);
      },
      () => {
        setError("No fue posible cargar los productos.");
        setLoading(false);
      },
    );
    const unsubscribeMerchant = onSnapshot(
      query(
        collection(db, "merchants"),
        where("businessId", "==", businessId),
        limit(1),
      ),
      (snapshot) => {
        setMerchantDocumentId(snapshot.docs[0]?.id ?? businessId);
      },
      () => setMerchantDocumentId(businessId),
    );
    return () => {
      unsubscribeBusiness();
      unsubscribeProducts();
      unsubscribeMerchant();
    };
  }, [businessId, enabled]);

  return { business, merchantDocumentId, products, loading, error };
}

export function MerchantOperationsSummary({
  businessId,
  enabled,
}: {
  businessId: string;
  enabled: boolean;
}) {
  const { products } = useMerchantOperations(businessId, enabled);
  if (!enabled) return null;
  const metrics = [
    [
      "Publicados",
      products.filter((item) => item.published && item.status === "active")
        .length,
    ],
    [
      "Ocultos",
      products.filter((item) => !item.published || item.status === "inactive")
        .length,
    ],
    [
      "Stock bajo",
      products.filter(
        (item) => item.stock > 0 && item.stock <= item.minimumStock,
      ).length,
    ],
    ["Agotados", products.filter((item) => item.stock === 0).length],
  ];
  return (
    <section
      aria-label="Resumen de productos"
      className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {metrics.map(([label, value]) => (
        <article
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-brand-navy">{value}</p>
        </article>
      ))}
    </section>
  );
}

export function MerchantBusinessWorkspace({
  businessId,
  enabled,
}: {
  businessId: string;
  enabled: boolean;
}) {
  const { business, merchantDocumentId, loading, error } =
    useMerchantOperations(businessId, enabled);
  const [message, setMessage] = useState<string | null>(null);
  if (!enabled) return <UnavailableWorkspace />;
  if (loading || !business) return <Loading />;
  return (
    <WorkspaceHeader
      eyebrow="Perfil comercial"
      title="Mi negocio"
      description="Administra únicamente la información que puede mostrarse a tus clientes."
    >
      <form
        key={String(business.updatedAt?.seconds ?? "business")}
        className="mt-6 grid gap-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage(null);
          const data = new FormData(event.currentTarget);
          const parsed = businessProfileSchema.safeParse({
            name: data.get("name"),
            description: data.get("description"),
            categoryId: data.get("categoryId"),
            phone: data.get("phone"),
            whatsapp: data.get("whatsapp"),
            hours: data.get("hours"),
            stall: data.get("stall"),
            logo: data.get("logo"),
            coverImage: data.get("coverImage"),
            published: data.get("published") === "on",
          });
          if (!parsed.success) {
            setMessage("Revisa los campos marcados antes de guardar.");
            return;
          }
          const db = getFirebaseDb();
          const batch = writeBatch(db);
          batch.update(doc(db, "businesses", businessId), {
            ...parsed.data,
            categoryIds: [parsed.data.categoryId],
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, "merchants", merchantDocumentId), {
            displayName: parsed.data.name,
            description: parsed.data.description,
            categoryIds: [parsed.data.categoryId],
            whatsappDemo: parsed.data.whatsapp,
            image:
              parsed.data.coverImage ||
              parsed.data.logo ||
              "/images/home/hero-market.webp",
            imageAlt: parsed.data.name,
            published: parsed.data.published,
            updatedAt: serverTimestamp(),
          });
          await batch.commit();
          setMessage("Información comercial actualizada.");
        }}
      >
        <Input
          name="name"
          label="Nombre comercial"
          defaultValue={String(business.name ?? "")}
        />
        <SelectCategory
          defaultValue={String(business.categoryId ?? "category-groceries")}
        />
        <label className="text-sm font-bold text-brand-navy sm:col-span-2">
          Descripción
          <textarea
            name="description"
            required
            minLength={10}
            defaultValue={String(business.description ?? "")}
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          />
        </label>
        <Input
          name="phone"
          label="Teléfono"
          defaultValue={String(business.phone ?? "")}
        />
        <Input
          name="whatsapp"
          label="WhatsApp"
          defaultValue={String(business.whatsapp ?? business.phone ?? "")}
        />
        <Input
          name="hours"
          label="Horario"
          defaultValue={String(business.hours ?? "")}
        />
        <Input
          name="stall"
          label="Local o puesto"
          defaultValue={String(business.stall ?? "")}
        />
        <Input
          name="logo"
          label="URL del logo"
          type="url"
          defaultValue={String(business.logo ?? "")}
        />
        <Input
          name="coverImage"
          label="URL de portada"
          type="url"
          defaultValue={String(business.coverImage ?? "")}
        />
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-brand-navy sm:col-span-2">
          <input
            name="published"
            type="checkbox"
            defaultChecked={business.published === true}
            className="size-4 accent-brand-green"
          />{" "}
          Publicar mi perfil en el marketplace
        </label>
        {(message || error) && (
          <p
            role="status"
            className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800 sm:col-span-2"
          >
            {message ?? error}
          </p>
        )}
        <button className="button-primary w-fit sm:col-span-2">
          <Save className="size-4" /> Guardar cambios
        </button>
      </form>
    </WorkspaceHeader>
  );
}

export function MerchantProductsWorkspace({
  businessId,
  enabled,
}: {
  businessId: string;
  enabled: boolean;
}) {
  const { products, loading, error } = useMerchantOperations(
    businessId,
    enabled,
  );
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LiveProduct | null | "new">(null);
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      products.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );
  if (!enabled) return <UnavailableWorkspace />;
  return (
    <WorkspaceHeader
      eyebrow="Catálogo"
      title="Productos"
      description="Crea, edita, publica u oculta productos sin perder su historial."
    >
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <label className="relative block sm:max-w-md sm:flex-1">
          <Search className="absolute top-3.5 left-3 size-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar productos"
            className="min-h-11 w-full rounded-xl border border-slate-300 pr-3 pl-9"
          />
        </label>
        <button onClick={() => setEditing("new")} className="button-primary">
          <PackagePlus className="size-4" /> Nuevo producto
        </button>
      </div>
      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      )}
      {editing && (
        <ProductForm
          businessId={businessId}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setMessage("Producto guardado correctamente.");
            setEditing(null);
          }}
        />
      )}
      {loading ? (
        <Loading />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-brand-navy">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    L {(product.priceMinor / 100).toFixed(2)} / {product.unit}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${product.published && product.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {product.published && product.status === "active"
                    ? "Publicado"
                    : "Oculto"}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                {product.description}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditing(product)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  <Pencil className="size-3.5" /> Editar
                </button>
                <button
                  onClick={() =>
                    void updateDoc(
                      doc(getFirebaseDb(), "products", product.id),
                      {
                        published: !product.published,
                        updatedAt: serverTimestamp(),
                      },
                    )
                  }
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 text-xs font-bold"
                >
                  {product.published ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  {product.published ? "Ocultar" : "Publicar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </WorkspaceHeader>
  );
}

function ProductForm({
  businessId,
  product,
  onClose,
  onSaved,
}: {
  businessId: string;
  product: LiveProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-5 grid gap-4 rounded-2xl border border-brand-green/20 bg-brand-green-pale/30 p-4 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const parsed = merchantProductSchema.safeParse({
          name: data.get("name"),
          description: data.get("description"),
          categoryId: data.get("categoryId"),
          image: data.get("image"),
          priceMinor: Math.round(Number(data.get("price")) * 100),
          unit: data.get("unit"),
          sku: data.get("sku"),
          stock: Number(data.get("stock")),
          minimumStock: Number(data.get("minimumStock")),
          published: data.get("published") === "on",
          status: data.get("status"),
        });
        if (!parsed.success) {
          setError("Revisa la información del producto.");
          return;
        }
        const db = getFirebaseDb();
        const reference = product
          ? doc(db, "products", product.id)
          : doc(collection(db, "products"));
        const slug = `${parsed.data.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}-${reference.id.slice(0, 6)}`;
        await setDoc(
          reference,
          {
            id: reference.id,
            businessId,
            ...parsed.data,
            slug,
            imageAlt: parsed.data.name,
            referencePrice: {
              amountMinor: parsed.data.priceMinor,
              currency: "HNL",
            },
            availability:
              parsed.data.stock === 0
                ? "unavailable"
                : parsed.data.stock <= parsed.data.minimumStock
                  ? "limited"
                  : "available",
            featured: false,
            ...(product ? {} : { createdAt: serverTimestamp() }),
            updatedAt: serverTimestamp(),
          },
          { merge: Boolean(product) },
        );
        onSaved();
      }}
    >
      <Input name="name" label="Nombre" defaultValue={product?.name ?? ""} />
      <SelectCategory
        defaultValue={product?.categoryId ?? "category-groceries"}
      />
      <label className="text-sm font-bold text-brand-navy sm:col-span-2">
        Descripción
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          required
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
        />
      </label>
      <Input
        name="image"
        label="URL de imagen"
        type="text"
        defaultValue={product?.image ?? "/images/home/hero-market.webp"}
      />
      <Input
        name="price"
        label="Precio (L)"
        type="number"
        defaultValue={product ? String(product.priceMinor / 100) : "0"}
      />
      <Input
        name="unit"
        label="Unidad / presentación"
        defaultValue={product?.unit ?? "unidad"}
      />
      <Input
        name="sku"
        label="SKU interno (opcional)"
        defaultValue={product?.sku ?? ""}
      />
      <Input
        name="stock"
        label="Existencia"
        type="number"
        defaultValue={String(product?.stock ?? 0)}
      />
      <Input
        name="minimumStock"
        label="Stock mínimo"
        type="number"
        defaultValue={String(product?.minimumStock ?? 0)}
      />
      <label className="text-sm font-bold text-brand-navy">
        Estado
        <select
          name="status"
          defaultValue={product?.status ?? "active"}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="active">Activo</option>
          <option value="inactive">Desactivado</option>
        </select>
      </label>
      <label className="flex items-center gap-2 self-end rounded-xl bg-white p-3 text-sm font-bold text-brand-navy">
        <input
          name="published"
          type="checkbox"
          defaultChecked={product?.published ?? false}
        />{" "}
        Publicado
      </label>
      {error && (
        <p
          role="alert"
          className="text-sm font-semibold text-rose-700 sm:col-span-2"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="button-primary">
          <Save className="size-4" /> Guardar
        </button>
        <button type="button" onClick={onClose} className="button-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function MerchantInventoryWorkspace({
  businessId,
  enabled,
}: {
  businessId: string;
  enabled: boolean;
}) {
  const { products, loading, error } = useMerchantOperations(
    businessId,
    enabled,
  );
  const [selected, setSelected] = useState<LiveProduct | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!enabled) return <UnavailableWorkspace />;
  return (
    <WorkspaceHeader
      eyebrow="Control básico"
      title="Inventario"
      description="Registra entradas, salidas y ajustes. Una solicitud de cotización no descuenta existencias."
    >
      {message && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      )}
      {selected && (
        <InventoryForm
          product={selected}
          businessId={businessId}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setMessage("Movimiento registrado.");
            setSelected(null);
          }}
        />
      )}
      {loading ? (
        <Loading />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1.5fr_.7fr_.8fr_.8fr_auto] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 md:grid">
            <span>Producto</span>
            <span>Existencia</span>
            <span>Mínimo</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>
          {products.map((product) => {
            const state =
              product.stock === 0
                ? "Agotado"
                : product.stock <= product.minimumStock
                  ? "Stock bajo"
                  : "Disponible";
            return (
              <article
                key={product.id}
                className="grid gap-3 border-t border-slate-100 p-4 first:border-t-0 md:grid-cols-[1.5fr_.7fr_.8fr_.8fr_auto] md:items-center"
              >
                <p className="font-extrabold text-brand-navy">{product.name}</p>
                <p className="text-sm font-bold">
                  {product.stock} {product.unit}
                </p>
                <p className="text-sm text-slate-600">{product.minimumStock}</p>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${state === "Disponible" ? "bg-emerald-50 text-emerald-700" : state === "Stock bajo" ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-700"}`}
                >
                  {state}
                </span>
                <button
                  onClick={() => setSelected(product)}
                  className="button-secondary min-h-10 px-3 text-xs"
                >
                  <Plus className="size-3.5" /> Movimiento
                </button>
              </article>
            );
          })}
        </div>
      )}
    </WorkspaceHeader>
  );
}

function InventoryForm({
  product,
  businessId,
  onClose,
  onSaved,
}: {
  product: LiveProduct;
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const parsed = inventoryMovementSchema.safeParse({
          productId: product.id,
          type: data.get("type"),
          quantity: Number(data.get("quantity")),
          reason: data.get("reason"),
        });
        if (!parsed.success) {
          setError("Revisa el movimiento.");
          return;
        }
        const db = getFirebaseDb();
        const movementReference = doc(collection(db, "inventoryMovements"));
        try {
          await runTransaction(db, async (transaction) => {
            const productReference = doc(db, "products", product.id);
            const snapshot = await transaction.get(productReference);
            if (!snapshot.exists() || snapshot.data().businessId !== businessId)
              throw new Error("Producto no autorizado.");
            const previousStock = Math.max(
              0,
              Number(snapshot.data().stock ?? 0),
            );
            const newStock =
              parsed.data.type === "entry"
                ? previousStock + parsed.data.quantity
                : parsed.data.type === "exit"
                  ? previousStock - parsed.data.quantity
                  : parsed.data.quantity;
            if (newStock < 0)
              throw new Error("La salida supera la existencia actual.");
            const minimumStock = Math.max(
              0,
              Number(snapshot.data().minimumStock ?? 0),
            );
            transaction.update(productReference, {
              stock: newStock,
              availability:
                newStock === 0
                  ? "unavailable"
                  : newStock <= minimumStock
                    ? "limited"
                    : "available",
              updatedAt: serverTimestamp(),
            });
            transaction.set(movementReference, {
              id: movementReference.id,
              businessId,
              productId: product.id,
              type: parsed.data.type,
              quantity: parsed.data.quantity,
              previousStock,
              newStock,
              reason: parsed.data.reason,
              createdAt: serverTimestamp(),
              createdBy: getFirebaseAuth().currentUser?.uid ?? "",
            });
          });
          onSaved();
        } catch (submissionError) {
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : "No fue posible registrar el movimiento.",
          );
        }
      }}
    >
      <p className="font-extrabold text-brand-navy sm:col-span-4">
        {product.name} · {product.stock} {product.unit}
      </p>
      <label className="text-xs font-bold">
        Tipo
        <select
          name="type"
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="entry">Entrada</option>
          <option value="exit">Salida</option>
          <option value="adjustment">Ajuste</option>
        </select>
      </label>
      <Input name="quantity" label="Cantidad" type="number" defaultValue="1" />
      <label className="text-xs font-bold sm:col-span-2">
        Motivo
        <input
          name="reason"
          required
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
        />
      </label>
      {error && (
        <p
          role="alert"
          className="text-sm font-semibold text-rose-700 sm:col-span-4"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-4">
        <button className="button-primary">
          <Boxes className="size-4" /> Registrar
        </button>
        <button type="button" onClick={onClose} className="button-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function MerchantDocumentsWorkspace() {
  return (
    <WorkspaceHeader
      eyebrow="Flujo comercial"
      title="Documentos"
      description="Convierte cotizaciones en documentos comerciales internos cuando la venta sea confirmada."
    >
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
        <Archive className="mx-auto size-8 text-brand-blue" />
        <h3 className="mt-3 font-extrabold text-brand-navy">
          Preparado para la siguiente etapa
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Los comprobantes comerciales se mantendrán claramente separados de una
          factura fiscal oficial. No se emiten documentos tributarios desde esta
          plataforma.
        </p>
      </div>
    </WorkspaceHeader>
  );
}

function WorkspaceHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-sm font-bold text-brand-blue">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-black text-brand-navy sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
      {children}
    </section>
  );
}
function Input({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <label className="text-sm font-bold text-brand-navy">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={
          !label.includes("opcional") &&
          !label.startsWith("URL") &&
          name !== "hours" &&
          name !== "stall"
        }
        min={type === "number" ? 0 : undefined}
        step={name === "price" ? "0.01" : undefined}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
      />
    </label>
  );
}
function SelectCategory({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="text-sm font-bold text-brand-navy">
      Categoría
      <select
        name="categoryId"
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
      >
        {categories.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Loading() {
  return (
    <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
      <LoaderCircle className="size-4 animate-spin" /> Cargando información…
    </p>
  );
}
function UnavailableWorkspace() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <CircleAlert className="size-5 text-amber-800" />
      <p className="mt-2 font-bold text-amber-950">
        Esta sección requiere una cuenta comercial autorizada.
      </p>
    </div>
  );
}
