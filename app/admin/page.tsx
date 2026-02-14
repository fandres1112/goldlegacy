'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingCart, Users, DollarSign, FileDown } from "lucide-react";
import { AreaChart, BarChart, DonutChart } from "@tremor/react";
import { formatPriceCOP } from "@/lib/formatPrice";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const;
type OrderStatusValue = (typeof ORDER_STATUSES)[number];

type OrderRow = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
  customerEmail?: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string };
  }>;
};

type Summary = {
  productsCount: number;
  ordersCount: number;
  usersCount: number;
  totalRevenue: number;
  latestOrders: OrderRow[];
  ordersOverTime?: Array<{ date: string; órdenes: number; ingresos: number }>;
  ordersByStatus?: Array<{ name: string; value: number }>;
  productsByCategory?: Array<{ name: string; value: number }>;
};

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const ORDERS_PAGE_SIZE = 5;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await fetch("/api/admin/summary");
        const data = await res.json();
        if (res.ok) {
          setSummary(data);
        }
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch(`/api/orders?page=${ordersPage}&pageSize=${ORDERS_PAGE_SIZE}`, { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setOrders(data.items ?? []);
          setOrdersTotal(data.total ?? 0);
        }
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [user, ordersPage]);

  const handleExportOrders = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch("/api/admin/orders/export", { credentials: "include" });
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? `ordenes-goldlegacy-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("No se pudo descargar el reporte. Vuelve a intentar.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatusValue) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loadingUser) {
    return (
      <div className="container-page py-16 md:py-20 text-sm text-muted">
        Verificando sesión...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container-page py-16 md:py-20 max-w-md">
        <h1 className="heading-section mb-2">Panel administrativo</h1>
        <p className="text-muted text-sm mb-6">
          Debes iniciar sesión con una cuenta de administrador para acceder al panel.
        </p>
        <Link href="/iniciar-sesion" className="btn-primary inline-block">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-10">
      <div className="mb-8">
        <h1 className="heading-section text-2xl sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">
          Bienvenido, {user.name ?? "Administrador"}. Resumen de tu tienda.
        </p>
      </div>

      {summaryLoading && !summary ? (
        <p className="text-sm text-muted">Cargando resumen...</p>
      ) : summary ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            <AdminStat
              icon={<Package className="h-6 w-6" />}
              label="Productos"
              value={summary.productsCount}
            />
            <AdminStat
              icon={<ShoppingCart className="h-6 w-6" />}
              label="Órdenes"
              value={summary.ordersCount}
            />
            <AdminStat
              icon={<Users className="h-6 w-6" />}
              label="Clientes"
              value={summary.usersCount}
            />
            <AdminStat
              icon={<DollarSign className="h-6 w-6" />}
              label="Ingresos totales"
              value={formatPriceCOP(Number(summary.totalRevenue))}
            />
          </div>

          <div className="glass-surface rounded-2xl p-5 md:p-6 border-white/10 mb-10">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-base font-semibold text-white">
                Órdenes
              </h2>
              <div className="flex items-center gap-3">
                {ordersTotal > 0 && (
                  <span className="text-xs text-muted">
                    {ordersTotal} {ordersTotal === 1 ? "orden" : "órdenes"} en total
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleExportOrders}
                  disabled={exportLoading}
                  className="text-xs text-gold hover:text-gold-light border border-gold/40 hover:border-gold/60 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="h-3 w-3" />
                  {exportLoading ? "Generando..." : "Descargar Excel"}
                </button>
              </div>
            </div>
            {exportError && (
              <p className="text-sm text-red-300 mb-3">{exportError}</p>
            )}
            {ordersLoading ? (
              <p className="text-sm text-muted">Cargando órdenes...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted">
                Aún no hay órdenes registradas.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-muted text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="text-left py-2.5 font-medium">Cliente</th>
                        <th className="text-left py-2.5 font-medium">Fecha</th>
                        <th className="text-left py-2.5 font-medium">Estado</th>
                        <th className="text-left py-2.5 font-medium">Productos</th>
                        <th className="text-right py-2.5 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-white/5 hover:bg-white/[0.03]"
                        >
                          <td className="py-2.5">
                            <span className="text-white/95 font-medium">{order.customerName}</span>
                            {order.customerEmail && (
                              <span className="block text-xs text-muted truncate max-w-[140px]" title={order.customerEmail}>
                                {order.customerEmail}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-muted text-xs whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleString("es", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="py-2.5">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleOrderStatusChange(order.id, e.target.value as OrderStatusValue)
                              }
                              disabled={updatingOrderId === order.id}
                              className="input-theme border rounded-lg px-2 py-1 text-xs text-foreground focus:border-gold/60 outline-none disabled:opacity-60"
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s === "PENDING"
                                    ? "Pendiente"
                                    : s === "PAID"
                                      ? "Pagado"
                                      : s === "SHIPPED"
                                        ? "Enviado"
                                        : "Cancelado"}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 text-muted text-xs max-w-[200px]">
                            {order.items.map((item) => (
                              <span key={item.id} className="block truncate" title={`${item.product.name} · ${item.quantity} ud · ${formatPriceCOP(Number(item.unitPrice))} c/u`}>
                                {item.product.name} ×{item.quantity}
                              </span>
                            ))}
                          </td>
                          <td className="py-2.5 text-right text-gold font-semibold whitespace-nowrap">
                            {formatPriceCOP(Number(order.total))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ordersTotal > ORDERS_PAGE_SIZE && orders.length > 0 && (
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-muted">
                      Mostrando {(ordersPage - 1) * ORDERS_PAGE_SIZE + 1}–{Math.min(ordersPage * ORDERS_PAGE_SIZE, ordersTotal)} de {ordersTotal}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                        disabled={ordersPage <= 1}
                        className="text-xs text-gold hover:text-gold-light disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1"
                      >
                        Anterior
                      </button>
                      <span className="text-xs text-muted">
                        Página {ordersPage} de {Math.ceil(ordersTotal / ORDERS_PAGE_SIZE)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrdersPage((p) => p + 1)}
                        disabled={ordersPage >= Math.ceil(ordersTotal / ORDERS_PAGE_SIZE)}
                        className="text-xs text-gold hover:text-gold-light disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {(summary.ordersOverTime?.length ?? 0) > 0 ||
          (summary.ordersByStatus?.length ?? 0) > 0 ||
          (summary.productsByCategory?.length ?? 0) > 0 ? (
            <div className="admin-charts grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {summary.ordersOverTime && summary.ordersOverTime.length > 0 && (
                <div className="glass-surface rounded-2xl p-5 border-white/10">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Órdenes e ingresos (últimos 14 días)
                  </h2>
                  <AreaChart
                    data={summary.ordersOverTime}
                    index="date"
                    categories={["órdenes", "ingresos"]}
                    colors={["amber", "yellow"]}
                    valueFormatter={(v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(0)}k COP` : String(v))}
                    showLegend
                    className="h-56"
                  />
                </div>
              )}
              {summary.ordersByStatus && summary.ordersByStatus.length > 0 && (
                <div className="glass-surface rounded-2xl p-5 border-white/10">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Órdenes por estado
                  </h2>
                  <DonutChart
                    data={summary.ordersByStatus}
                    category="value"
                    index="name"
                    colors={["amber", "yellow", "gold", "slate"]}
                    valueFormatter={(v) => String(v)}
                    className="h-56"
                  />
                </div>
              )}
              {summary.productsByCategory && summary.productsByCategory.length > 0 && (
                <div className="glass-surface rounded-2xl p-5 border-white/10 lg:col-span-2">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Productos por categoría
                  </h2>
                  <BarChart
                    data={summary.productsByCategory}
                    index="name"
                    categories={["value"]}
                    colors={["amber"]}
                    valueFormatter={(v) => String(v)}
                    layout="horizontal"
                    className="h-56"
                  />
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted">No se pudo cargar el resumen.</p>
      )}
    </div>
  );
}

function AdminStat({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass-surface rounded-2xl p-5 md:p-6 border-white/10 flex items-start gap-4">
      <div className="rounded-xl bg-gold/10 text-gold p-2.5 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted mb-1">{label}</p>
        <p className="text-xl md:text-2xl font-semibold text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

