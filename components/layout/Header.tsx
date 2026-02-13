'use client';

import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";

export function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
      {/* Línea dorada superior */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      <div className="container-page">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo: siglas GL hasta tener logo definitivo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.35)] transition-all duration-300 group-hover:scale-105">
              <span className="text-xs font-semibold tracking-[0.18em] text-black">
                GL
              </span>
            </div>
            <div className="flex flex-col leading-tight hidden sm:block">
              <span className="font-display text-lg md:text-xl tracking-[0.22em] uppercase text-white group-hover:text-gold transition-colors duration-300">
                Gold Legacy
              </span>
              <span className="text-[10px] md:text-[11px] tracking-[0.18em] text-white/50 group-hover:text-gold/70 transition-colors duration-300">
                Tradición familiar hecha joya
              </span>
            </div>
          </Link>

          {/* Navegación central */}
          <nav className="hidden md:flex items-center gap-10 text-[13px] font-medium tracking-[0.12em] uppercase">
            <Link
              href="/catalogo"
              className="relative py-1 text-white/80 hover:text-gold transition-colors duration-300 after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            >
              Colección
            </Link>
            <Link
              href="/sobre-nosotros"
              className="relative py-1 text-white/80 hover:text-gold transition-colors duration-300 after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            >
              Sobre nosotros
            </Link>
          </nav>

          {/* Acciones: Admin (user) + Carrito */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-white/10 text-white/70 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
              title="Panel de administración"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
            <Link
              href="/carrito"
              className="relative flex items-center justify-center h-10 w-10 rounded-full border border-white/10 text-white/70 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-300 group"
              title="Carrito"
            >
              <ShoppingBag className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Línea sutil inferior */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </header>
  );
}
