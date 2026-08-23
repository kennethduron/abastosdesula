"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { addItemToCart, type Cart, type CartItem } from "@/domain";

import { CartDrawer } from "./cart-drawer";

const STORAGE_KEY = "abastos-demo-cart-v1";
const CART_EVENT = "abastos-demo-cart-change";
const EMPTY_CART_SNAPSHOT = JSON.stringify({
  businessId: null,
  items: [],
  updatedAt: "2026-08-22T00:00:00.000Z",
} satisfies Cart);

const emptyCart = (): Cart => ({
  businessId: null,
  items: [],
  updatedAt: new Date().toISOString(),
});

function subscribeToCart(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CART_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CART_EVENT, callback);
  };
}

function getCartSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY_CART_SNAPSHOT;
}

function saveCart(cart: Cart) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  subtotalMinor: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  completeCart: () => void;
  openCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<CartItem | null>(null);
  const cartSnapshot = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => EMPTY_CART_SNAPSHOT,
  );
  const cart = useMemo(() => {
    try {
      return JSON.parse(cartSnapshot) as Cart;
    } catch {
      return emptyCart();
    }
  }, [cartSnapshot]);

  function addItem(item: CartItem) {
    const result = addItemToCart(cart, item);
    if (result.outcome === "business_conflict") {
      setPendingItem(item);
      return;
    }
    saveCart(result.cart);
    setDrawerOpen(true);
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    saveCart({
      ...cart,
      items: cart.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function removeItem(productId: string) {
    const items = cart.items.filter((item) => item.productId !== productId);
    saveCart({
      businessId: items.length ? cart.businessId : null,
      items,
      updatedAt: new Date().toISOString(),
    });
  }

  function clearCart() {
    saveCart(emptyCart());
    setDrawerOpen(false);
  }

  function replaceCart() {
    if (!pendingItem) return;
    const result = addItemToCart(emptyCart(), pendingItem);
    if (result.outcome === "added") {
      saveCart(result.cart);
      setDrawerOpen(true);
    }
    setPendingItem(null);
  }

  const value: CartContextValue = {
    cart,
    itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
    subtotalMinor: cart.items.reduce(
      (total, item) => total + item.priceMinor * item.quantity,
      0,
    ),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    completeCart: () => saveCart(emptyCart()),
    openCart: () => setDrawerOpen(true),
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {pendingItem && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-brand-navy/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-conflict-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
              Solicitudes separadas
            </p>
            <h2
              id="cart-conflict-title"
              className="mt-2 text-2xl font-extrabold text-brand-navy"
            >
              Tu carrito pertenece a otro comerciante
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Cada solicitud se envía a un solo negocio. Puedes conservar tu
              carrito actual o limpiarlo para continuar con{" "}
              {pendingItem.businessName}.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPendingItem(null)}
                className="button-secondary"
              >
                Conservar carrito
              </button>
              <button
                type="button"
                onClick={replaceCart}
                className="button-primary"
              >
                Limpiar y continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}
