import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <PublicHeader />
      {children}
      <PublicFooter />
    </CartProvider>
  );
}
