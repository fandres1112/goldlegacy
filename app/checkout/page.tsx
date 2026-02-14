'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { formatPriceCOP } from "@/lib/formatPrice";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (items.length === 0 && !success) {
    return (
      <div className="container-page py-12 md:py-16">
        <h1 className="heading-section mb-2">Checkout</h1>
        <p className="text-muted text-sm mb-4">
          Tu carrito está vacío. Agrega piezas desde el catálogo para continuar.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const payload = {
      customerName: String(formData.get("name") ?? "").trim(),
      customerEmail: String(formData.get("email") ?? "").trim(),
      customerPhone: (formData.get("phone") as string)?.trim() || undefined,
      shippingAddress: String(formData.get("address") ?? "").trim(),
      shippingCity: String(formData.get("city") ?? "").trim(),
      items: items.map((item) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity) || 1
      }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo procesar el pedido");
      }
      clear();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container-page py-12 md:py-16 max-w-2xl">
        <div className="glass-surface rounded-2xl p-8 md:p-10 border-gold/20 text-center">
          <div className="inline-flex h-14 w-14 rounded-full bg-gold/15 text-gold items-center justify-center mb-6">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="heading-section mb-3">¡Gracias por tu confianza!</h1>
          <p className="text-sm text-foreground mb-3">
            Tu pedido está confirmado. En Gold Legacy cada detalle cuenta: revisamos cada pieza, tu dirección y tus datos para que todo llegue perfecto.
          </p>
          <p className="text-muted text-sm mb-4">
            En breve recibirás un correo con el resumen de tu compra y los siguientes pasos. Si tienes cualquier duda, escríbenos.
          </p>
          <Link href="/catalogo" className="btn-outline inline-block text-sm">
            Seguir explorando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16 grid md:grid-cols-[1.4fr,1fr] gap-10 items-start">
      <div>
        <h1 className="heading-section mb-2">Checkout</h1>
        <p className="text-muted text-sm mb-6 max-w-md">
          Completa tus datos para finalizar la orden. Nos tomamos en serio la
          privacidad y solo usaremos esta información para tu compra.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">
                Nombre completo
              </label>
              <input
                name="name"
                required
                className="w-full rounded-full input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-full input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">
                Teléfono (opcional)
              </label>
              <input
                name="phone"
                className="w-full rounded-full input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Ciudad
              </label>
              <input
                name="city"
                required
                className="w-full rounded-full input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Dirección de envío
            </label>
            <textarea
              name="address"
              required
              rows={3}
              className="w-full rounded-2xl input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 resize-none text-foreground"
            />
          </div>

          {error && (
            <p className="text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2"
          >
            {loading ? "Procesando pedido..." : "Confirmar pedido"}
          </button>
        </form>
      </div>

      <aside className="glass-surface rounded-2xl p-5 space-y-4 border-gold/10 text-sm">
        <div>
          <p className="text-gray-200 mb-1">Resumen de piezas</p>
          <p className="text-xs text-muted">
            Revisa que cantidades y piezas coincidan con lo que deseas recibir.
          </p>
        </div>
        <div className="max-h-64 overflow-auto space-y-3 pr-1">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-xs">
              <div>
                <p className="text-gray-200">
                  {item.name}
                </p>
                <p className="text-muted">
                  {item.quantity} x {formatPriceCOP(item.price)}
                </p>
              </div>
              <p className="text-gold font-semibold">
                {formatPriceCOP(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-muted text-xs">Total estimado</span>
          <span className="text-gold font-semibold">
            {formatPriceCOP(total)}
          </span>
        </div>
      </aside>
    </div>
  );
}

