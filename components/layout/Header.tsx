'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, User, Heart, LogOut, Package, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useTheme } from "@/contexts/ThemeContext";

type AuthUser = { id: string; name: string | null; email: string; role: string } | null;

function getInitial(user: AuthUser): string {
  if (!user) return "?";
  const name = user.name?.trim();
  if (name) return name[0].toUpperCase();
  return (user.email[0] ?? "?").toUpperCase();
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const [user, setUser] = useState<AuthUser>(undefined as unknown as AuthUser);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    const handle = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    setAccountOpen(false);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.refresh();
    if (pathname?.startsWith("/admin")) {
      router.push("/");
    }
  };

  const wishlistCount = productIds.length;
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
      {/* Línea dorada superior — sutil */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="container-page">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-[4.5rem]">
          {/* Logo: marca + nombre, sin lema para un header más limpio */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group"
          >
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] ring-1 ring-gold/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_28px_rgba(212,175,55,0.4)]">
              <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-black">
                GL
              </span>
            </div>
            <span className="font-display text-base sm:text-lg md:text-xl tracking-[0.2em] sm:tracking-[0.22em] uppercase text-foreground group-hover:text-gold transition-colors duration-300">
              Gold Legacy
            </span>
          </Link>

          {/* Navegación central */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-8 text-[12px] font-medium tracking-[0.14em] uppercase">
            <Link
              href="/catalogo"
              className="relative py-2 text-foreground-muted hover:text-gold transition-colors duration-300 after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            >
              Colección
            </Link>
            <Link
              href="/sobre-nosotros"
              className="relative py-2 text-foreground-muted hover:text-gold transition-colors duration-300 after:absolute after:left-0 after:bottom-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            >
              Sobre nosotros
            </Link>
          </nav>

          {/* Acciones: Cuenta (dropdown) + Lista de deseos + Carrito */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-border text-foreground-muted hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-300"
              title={theme === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
              )}
            </button>
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => user !== undefined && setAccountOpen((o) => !o)}
                className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border transition-all duration-300 ${
                  accountOpen
                    ? "border-gold/50 text-gold bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                    : "border-border text-foreground-muted hover:text-gold hover:border-gold/30 hover:bg-gold/5"
                } ${user === undefined ? "opacity-70" : ""}`}
                title={user === undefined ? "Cargando…" : user ? "Cuenta" : "Entrar o crear cuenta"}
              >
                {user ? (
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-inherit">
                    {getInitial(user)}
                  </span>
                ) : (
                  <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
                )}
              </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border dropdown-panel shadow-xl shadow-black/40 py-2 z-50 animate-in origin-top-right"
                    role="menu"
                  >
                    <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                    {user ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-border">
                          <p className="text-xs text-foreground font-medium truncate">
                            {user.name || "Cuenta"}
                          </p>
                          <p className="text-[11px] text-foreground-muted truncate">{user.email}</p>
                        </div>
                        <div className="py-1.5">
                          <Link
                            href="/mis-ordenes"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-foreground hover:text-gold hover:bg-foreground/5 transition-colors"
                          >
                            <Package className="h-4 w-4 text-foreground-muted shrink-0" />
                            Mis órdenes
                          </Link>
                          {user.role === "ADMIN" && (
                            <Link
                              href="/admin"
                              onClick={() => setAccountOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-foreground hover:text-gold hover:bg-foreground/5 transition-colors"
                            >
                              <LayoutDashboard className="h-4 w-4 text-foreground-muted shrink-0" />
                              Panel admin
                            </Link>
                          )}
                        </div>
                        <div className="h-px bg-border my-1" />
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-foreground-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
                          >
                            <LogOut className="h-4 w-4 shrink-0" />
                            Cerrar sesión
                          </button>
                        </div>
                      </>
                    ) : user === null ? (
                      <div className="py-1.5">
                        <Link
                          href="/iniciar-sesion"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-foreground hover:text-gold hover:bg-foreground/5 transition-colors"
                        >
                          <User className="h-4 w-4 text-foreground-muted shrink-0" />
                          Iniciar sesión
                        </Link>
                      </div>
                    ) : (
                      <div className="px-4 py-4 text-center text-[13px] text-foreground-muted">
                        Cargando…
                      </div>
                    )}
                  </div>
                )}
              </div>
            <Link
              href="/lista-deseos"
              className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-border text-foreground-muted hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-300"
              title="Lista de deseos"
            >
              <Heart className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[18px] px-1 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/carrito"
              className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-border text-foreground-muted hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all duration-300 group"
              title="Carrito"
            >
              <ShoppingBag className="h-4 w-4 sm:h-[18px] sm:w-[18px] transition-transform duration-300 group-hover:scale-110" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[18px] px-1 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Línea sutil inferior */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
    </header>
  );
}
