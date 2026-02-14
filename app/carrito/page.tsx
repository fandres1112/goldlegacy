'use client';

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/CartContext";
import { Trash2, Plus, Minus } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { formatPriceCOP } from "@/lib/formatPrice";

export default function CartPage() {
  const { items, total, removeItem, updateQuantity, itemCount } = useCart();

  const hasItems = items.length > 0;

  const handleRemove = (productId: string, name: string) => {
    removeItem(productId);
    toast(`${name} eliminado del carrito`, "success");
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    updateQuantity(productId, newQuantity);
  };

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mb-8 animate-in">
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold-light/80 mb-2">
          Tu selección
        </p>
        <h1 className="heading-section text-3xl md:text-4xl mb-2">
          Carrito Gold Legacy
        </h1>
        <p className="text-muted text-sm max-w-md">
          Revisa las piezas que formarán parte de tu colección antes de
          confirmar tu pedido.
        </p>
      </div>

      {!hasItems ? (
        <div className="glass-surface rounded-3xl p-12 text-center max-w-md mx-auto animate-in">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-gold/10 mx-auto flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-base text-white mb-2">Tu carrito está vacío</p>
            <p className="text-sm text-muted mb-6">
              Explora la colección y elige las piezas que mejor hablen de tu estilo.
            </p>
          </div>
          <Link href="/catalogo" className="btn-primary">
            Explorar colección
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[2fr,1fr] gap-8 items-start">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.productId}
                className="glass-surface rounded-2xl p-5 flex gap-4 items-center group hover:border-gold/30 transition-all animate-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-black/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-white mb-1 group-hover:text-gold transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted mb-3">
                    {formatPriceCOP(item.price)} · Oro certificado
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-white/10 rounded-full overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-white/5 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 text-xs font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-white/5 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.productId, item.name)}
                      className="ml-auto p-2 rounded-full hover:bg-red-500/10 text-red-300 hover:text-red-200 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg text-gold font-semibold">
                    {formatPriceCOP(item.price * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted mt-1">
                      {formatPriceCOP(item.price)} c/u
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <aside className="sticky top-24">
            <div className="glass-surface rounded-2xl p-6 space-y-5 border-gold/20">
              <div>
                <p className="text-base text-white font-medium mb-1">Resumen del pedido</p>
                <p className="text-xs text-muted">
                  {itemCount} {itemCount === 1 ? 'pieza' : 'piezas'} en tu carrito
                </p>
              </div>
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-gold text-lg">
                    {formatPriceCOP(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-white/5">
                  <span>Envío</span>
                  <span>Calculado en checkout</span>
                </div>
              </div>
              <Link href="/checkout" className="btn-primary w-full text-center block">
                Proceder al checkout
              </Link>
              <Link
                href="/catalogo"
                className="block text-center text-xs text-muted hover:text-gold-light transition-colors"
              >
                ← Seguir explorando
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

