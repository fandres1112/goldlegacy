'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
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
      customerName: formData.get("name") as string,
      customerEmail: formData.get("email") as string,
      customerPhone: (formData.get("phone") as string) || undefined,
      shippingAddress: formData.get("address") as string,
      shippingCity: formData.get("city") as string,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo procesar el pedido");
      }

      clear();
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container-page py-12 md:py-16">
        <h1 className="heading-section mb-2">Pedido confirmado</h1>
        <p className="text-muted text-sm mb-4 max-w-md">
          Hemos recibido tu orden correctamente. En breve recibirás un correo con
          el detalle y los siguientes pasos.
        </p>
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
                className="w-full rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80"
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
                className="w-full rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80"
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
                className="w-full rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Ciudad
              </label>
              <input
                name="city"
                required
                className="w-full rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80"
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
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80 resize-none"
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
                  {item.quantity} x {item.price.toFixed(2)} USD
                </p>
              </div>
              <p className="text-gold font-semibold">
                {(item.price * item.quantity).toFixed(2)} USD
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          <span className="text-muted text-xs">Total estimado</span>
          <span className="text-gold font-semibold">
            {total.toFixed(2)} USD
          </span>
        </div>
      </aside>
    </div>
  );
}

