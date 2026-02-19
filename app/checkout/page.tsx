'use client';

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { formatPriceCOP } from "@/lib/formatPrice";
import { formatOrderNumber } from "@/lib/formatOrderNumber";

type UserMe = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type UserAddress = {
  id: string;
  label: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  shippingAddress: string;
  shippingCity: string;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  address: ""
};

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [user, setUser] = useState<UserMe | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [mpEnabled, setMpEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/payments/mercadopago/status")
      .then((r) => r.json())
      .then((data) => setMpEnabled(Boolean(data?.enabled)))
      .catch(() => setMpEnabled(false));
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setAddressesLoaded(true);
      return;
    }
    const loadAddresses = async () => {
      try {
        const res = await fetch("/api/user/addresses", { credentials: "include" });
        const data = await res.json();
        setAddresses(res.ok ? (data.items ?? []) : []);
        if (res.ok && (data.items ?? []).length > 0) {
          setSelectedAddressId((data.items as UserAddress[])[0].id);
        } else {
          setSelectedAddressId("new");
        }
      } catch {
        setAddresses([]);
        setSelectedAddressId("new");
      } finally {
        setAddressesLoaded(true);
      }
    };
    loadAddresses();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (selectedAddressId === "new" || selectedAddressId === null) {
      setForm((prev) => ({
        name: user.name ?? "",
        email: user.email,
        phone: selectedAddressId === "new" ? "" : prev.phone,
        city: selectedAddressId === "new" ? "" : prev.city,
        address: selectedAddressId === "new" ? "" : prev.address
      }));
      return;
    }
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (addr) {
      setForm({
        name: addr.fullName,
        email: addr.email,
        phone: addr.phone ?? "",
        city: addr.shippingCity,
        address: addr.shippingAddress
      });
    }
  }, [user, selectedAddressId, addresses]);

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

    const payload = {
      customerName: form.name.trim(),
      customerEmail: form.email.trim(),
      customerPhone: form.phone.trim() || undefined,
      shippingAddress: form.address.trim(),
      shippingCity: form.city.trim(),
      items: items.map((item) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity) || 1
      }))
    };

    try {
      if (mpEnabled) {
        const res = await fetch("/api/payments/mercadopago/preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo preparar el pago");
        }
        if (user && saveNewAddress) {
          try {
            await fetch("/api/user/addresses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                fullName: payload.customerName,
                email: payload.customerEmail,
                phone: payload.customerPhone,
                shippingAddress: payload.shippingAddress,
                shippingCity: payload.shippingCity
              })
            });
          } catch {
            // No bloquear
          }
        }
        clear();
        if (data.init_point) {
          window.location.href = data.init_point;
          return;
        }
        throw new Error("No se obtuvo el enlace de pago");
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo procesar el pedido");
      }
      setOrderId(data.id ?? null);
      if (user && saveNewAddress) {
        try {
          await fetch("/api/user/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              fullName: payload.customerName,
              email: payload.customerEmail,
              phone: payload.customerPhone,
              shippingAddress: payload.shippingAddress,
              shippingCity: payload.shippingCity
            })
          });
        } catch {
          // No bloquear el flujo si falla guardar la dirección
        }
      }
      clear();
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
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
          {orderId && (
            <p className="text-gold font-semibold text-sm mb-2">
              Tu orden: {formatOrderNumber(orderId)}
            </p>
          )}
          <p className="text-sm text-foreground mb-3">
            Tu pedido está confirmado. En Gold Legacy cada detalle cuenta: revisamos cada pieza, tu dirección y tus datos para que todo llegue perfecto.
          </p>
          <p className="text-muted text-sm mb-4">
            En breve recibirás un correo con el resumen de tu compra y los siguientes pasos. Si tienes cualquier duda, indica tu número de orden al contactarnos.
          </p>
          <Link href="/catalogo" className="btn-outline inline-block text-sm">
            Seguir explorando
          </Link>
        </div>
      </div>
    );
  }

  const showSaveAddressCheckbox = user && (selectedAddressId === "new" || (selectedAddressId === null && addresses.length === 0));

  return (
    <div className="container-page py-12 md:py-16 grid md:grid-cols-[1.4fr,1fr] gap-10 items-start">
      <div>
        <h1 className="heading-section mb-2">Checkout</h1>
        <p className="text-muted text-sm mb-6 max-w-md">
          Completa tus datos para finalizar la orden. Nos tomamos en serio la
          privacidad y solo usaremos esta información para tu compra.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {user && addressesLoaded && addresses.length > 0 && (
            <div className="mb-6">
              <label className="block text-xs text-muted mb-2">
                ¿Usar una dirección guardada?
              </label>
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-white/10 hover:border-gold/30 cursor-pointer transition-colors has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5"
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-gold focus:ring-gold"
                    />
                    <div className="text-sm">
                      <span className="text-foreground font-medium">
                        {addr.label || addr.shippingCity}
                      </span>
                      <p className="text-muted text-xs mt-0.5">
                        {addr.shippingAddress}, {addr.shippingCity}
                        {addr.phone ? ` · ${addr.phone}` : ""}
                      </p>
                    </div>
                  </label>
                ))}
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 hover:border-gold/30 cursor-pointer transition-colors has-[:checked]:border-gold/60 has-[:checked]:bg-gold/5">
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddressId === "new"}
                    onChange={() => setSelectedAddressId("new")}
                    className="text-gold focus:ring-gold"
                  />
                  <span className="text-sm text-foreground">Nueva dirección</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">
                Nombre completo
              </label>
              <input
                name="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
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
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-2xl input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 resize-none text-foreground"
            />
          </div>

          {showSaveAddressCheckbox && (
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={(e) => setSaveNewAddress(e.target.checked)}
                className="rounded border-white/30 text-gold focus:ring-gold"
              />
              Guardar esta dirección para próximas compras
            </label>
          )}

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
            {loading
              ? mpEnabled
                ? "Redirigiendo a Mercado Pago..."
                : "Procesando pedido..."
              : mpEnabled
                ? "Ir a pagar con Mercado Pago"
                : "Confirmar pedido"}
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
