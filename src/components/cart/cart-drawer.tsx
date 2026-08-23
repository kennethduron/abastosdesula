"use client";

import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Image from "next/image";

import { useCart } from "./cart-provider";

const formatMoney = (amountMinor: number) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    cart,
    itemCount,
    subtotalMinor,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
  } = useCart();
  const whatsappMessage = encodeURIComponent(
    `Hola, quiero consultar esta solicitud demo para ${cart.items[0]?.businessName ?? "el comerciante"}:\n${cart.items.map((item) => `- ${item.productName}: ${item.quantity} ${item.unit}`).join("\n")}`,
  );

  return (
    <>
      {itemCount > 0 && !open && (
        <button
          type="button"
          data-testid="cart-dock"
          onClick={openCart}
          className="fixed right-4 bottom-4 z-50 inline-flex min-h-14 items-center gap-3 rounded-2xl bg-brand-green px-4 text-white shadow-2xl shadow-brand-green/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue sm:right-6 sm:bottom-6"
        >
          <span className="relative grid size-9 place-items-center rounded-xl bg-white/15">
            <ShoppingCart className="size-5" aria-hidden="true" />
            <span className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full bg-brand-blue px-1 text-[0.65rem] font-extrabold">
              {itemCount}
            </span>
          </span>
          <span className="text-left">
            <span className="block text-[0.65rem] font-bold text-white/75">
              Ver carrito
            </span>
            <span className="block text-sm font-extrabold">
              {formatMoney(subtotalMinor)}
            </span>
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Cerrar carrito"
            className="absolute inset-0 bg-brand-navy/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5">
              <div>
                <p className="text-xs font-extrabold text-brand-green">
                  Carrito de un comerciante
                </p>
                <h2
                  id="cart-title"
                  className="mt-1 text-2xl font-extrabold text-brand-navy"
                >
                  Tu solicitud
                </h2>
                {cart.items[0] && (
                  <p className="mt-1 text-sm text-slate-500">
                    {cart.items[0].businessName}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Cerrar carrito"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
              {cart.items.map((item) => (
                <article
                  key={item.productId}
                  className="grid grid-cols-[64px_1fr_auto] gap-3 border-b border-slate-100 py-4"
                >
                  <div className="relative size-16 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-brand-navy">
                      {item.productName}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-brand-green">
                      {formatMoney(item.priceMinor)} / {item.unit}
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-lg border border-slate-200">
                      <button
                        type="button"
                        aria-label={`Reducir cantidad de ${item.productName}`}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="grid size-9 place-items-center text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-8 text-center text-xs font-extrabold text-brand-navy">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${item.productName}`}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="grid size-9 place-items-center text-brand-green hover:bg-brand-green-pale focus-visible:outline-2 focus-visible:outline-brand-blue"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Eliminar ${item.productName}`}
                    onClick={() => removeItem(item.productId)}
                    className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            <div className="border-t border-slate-200 bg-white p-5 shadow-[0_-12px_30px_rgba(7,26,51,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">
                  Subtotal demo
                </span>
                <strong className="text-xl font-extrabold text-brand-navy">
                  {formatMoney(subtotalMinor)}
                </strong>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Precios de referencia ficticios. El comerciante confirmará
                disponibilidad y cotización.
              </p>
              <a
                href={`https://wa.me/${cart.items[0]?.whatsappDemo ?? "50400000000"}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="button-whatsapp mt-4 w-full"
              >
                Consultar por WhatsApp demo
              </a>
              <button
                type="button"
                onClick={clearCart}
                className="mt-2 min-h-11 w-full rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-brand-blue"
              >
                Vaciar carrito
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
