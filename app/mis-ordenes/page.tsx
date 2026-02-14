'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { formatPriceCOP } from "@/lib/formatPrice";
import { SectionTitle } from "@/components/ui/SectionTitle";

type OrderItem = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string };
  }>;
};

export default function MisOrdenesPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetch("/api/orders?pageSize=50", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          setUnauthorized(true);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data?.items)) {
          setOrders(data.items);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (unauthorized) {
    return (
      <div className="container-page py-12 md:py-16">
        <SectionTitle
          eyebrow="Cuenta"
          title="Mis órdenes"
          description="Inicia sesión para ver el historial de tus pedidos."
        />
        <div className="max-w-md mx-auto mt-10 text-center glass-surface rounded-2xl p-8 border-border">
          <Package className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-muted mb-6">Debes iniciar sesión para ver tus órdenes.</p>
          <Link href="/iniciar-sesion" className="btn-primary inline-block">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Cuenta"
        title="Mis órdenes"
        description="Historial de tus pedidos en Gold Legacy."
      />

      {loading ? (
        <p className="text-sm text-muted mt-8">Cargando...</p>
      ) : orders.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center border-border mt-10">
          <ShoppingBag className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-muted mb-2">Aún no tienes órdenes</p>
          <p className="text-sm text-muted mb-6">
            Cuando realices un pedido, aparecerá aquí.
          </p>
          <Link href="/catalogo" className="btn-primary inline-flex items-center gap-2">
            Ver colección
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="glass-surface rounded-2xl p-5 border-border"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs text-muted uppercase tracking-wider">
                  Orden #{order.id.slice(-8)}
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    order.status === "SHIPPED"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : order.status === "PAID"
                        ? "bg-gold/20 text-gold"
                        : order.status === "CANCELLED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-white/10 text-white/80"
                  }`}
                >
                  {order.status === "PENDING"
                    ? "Pendiente"
                    : order.status === "PAID"
                      ? "Pagado"
                      : order.status === "SHIPPED"
                        ? "Enviado"
                        : "Cancelado"}
                </span>
              </div>
              <p className="text-sm text-muted mb-2">
                {new Date(order.createdAt).toLocaleString("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </p>
              <ul className="text-sm text-white/90 space-y-1 mb-3">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} × {item.quantity} — {formatPriceCOP(Number(item.unitPrice))}
                  </li>
                ))}
              </ul>
              <p className="text-gold font-semibold">
                Total: {formatPriceCOP(Number(order.total))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
