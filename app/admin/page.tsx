'use client';

import { useEffect, useState, useMemo, useRef } from "react";
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
  shippingCity?: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
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
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [orderFilterQ, setOrderFilterQ] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [retryOrdersKey, setRetryOrdersKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const ORDERS_PAGE_SIZE = 10;
  const ORDERS_FETCH_SIZE = 500;

  const filteredOrders = useMemo(() => {
    let list = allOrders;
    const q = orderFilterQ.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
          (o.shippingCity && o.shippingCity.toLowerCase().includes(q))
      );
    }
    if (orderFilterStatus) {
      list = list.filter((o) => o.status === orderFilterStatus);
    }
    return list;
  }, [allOrders, orderFilterQ, orderFilterStatus]);

  const totalFiltered = filteredOrders.length;
  const ordersPageStart = (ordersPage - 1) * ORDERS_PAGE_SIZE;
  const ordersToShow = useMemo(
    () => filteredOrders.slice(ordersPageStart, ordersPageStart + ORDERS_PAGE_SIZE),
    [filteredOrders, ordersPageStart]
  );
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ORDERS_PAGE_SIZE));

  useEffect(() => {
    if (ordersPage > totalPages) setOrdersPage(1);
  }, [totalPages, ordersPage]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const text = await res.text();
        let data: { user?: AdminUser | null } = {};
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            setUser(null);
            setLoadingUser(false);
            return;
          }
        }
        setUser(data.user ?? null);
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
      setApiError(null);
      try {
        const res = await fetch("/api/admin/summary", { credentials: "include" });
        const text = await res.text();
        if (!res.ok) {
          let err: { detail?: string } = {};
          if (text.trim()) try { err = JSON.parse(text); } catch { /* ignore */ }
          setApiError(err.detail ?? (res.status === 500 ? "Error del servidor (500)" : "Error al cargar"));
          return;
        }
        let data: Summary | null = null;
        if (text.trim()) {
          try {
            data = JSON.parse(text) as Summary;
          } catch {
            console.error("[admin] Respuesta del resumen no es JSON válido");
          }
        }
        if (data) setSummary(data);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [user, retryKey]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;

    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch(
          `/api/orders?page=1&pageSize=${ORDERS_FETCH_SIZE}`,
          { credentials: "include" }
        );
        const text = await res.text();
        if (!res.ok) return;
        let data: { items?: OrderRow[] } = {};
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch {
            console.error("[admin] Respuesta de órdenes no es JSON válido");
          }
        }
        setAllOrders(data.items ?? []);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [user, retryOrdersKey]);

  const handleExportOrders = async () => {
    setExportLoading(true);
    setExportError(null);
    try {
      const params = new URLSearchParams();
      if (orderFilterQ.trim()) params.set("q", orderFilterQ.trim());
      if (orderFilterStatus) params.set("status", orderFilterStatus);
      const res = await fetch(
        `/api/admin/orders/export${params.toString() ? `?${params.toString()}` : ""}`,
        { credentials: "include" }
      );
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

  const handleOrderStatusChange = async (
    orderId: string,
    newStatus: OrderStatusValue,
    trackingNumber?: string | null,
    trackingUrl?: string | null
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const body: { status: OrderStatusValue; trackingNumber?: string | null; trackingUrl?: string | null } = { status: newStatus };
      if (newStatus === "SHIPPED") {
        body.trackingNumber = trackingNumber ?? null;
        body.trackingUrl = trackingUrl ?? null;
      }
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Error al actualizar");
      const updated = await res.json();
      setAllOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status, trackingNumber: updated.trackingNumber ?? null, trackingUrl: updated.trackingUrl ?? null } : o))
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateOrderTracking = (orderId: string, field: "trackingNumber" | "trackingUrl", value: string) => {
    setAllOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, [field]: value || null } : o))
    );
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const allOnPageSelected =
    ordersToShow.length > 0 && ordersToShow.every((o) => selectedOrderIds.has(o.id));
  const someOnPageSelected = ordersToShow.some((o) => selectedOrderIds.has(o.id));
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
  }, [someOnPageSelected, allOnPageSelected]);

  const toggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        ordersToShow.forEach((o) => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        ordersToShow.forEach((o) => next.add(o.id));
        return next;
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: OrderStatusValue) => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderIds: ids, status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al actualizar");
      setAllOrders((prev) =>
        prev.map((o) => (ids.includes(o.id) ? { ...o, status: newStatus } : o))
      );
      setSelectedOrderIds(new Set());
    } finally {
      setBulkUpdating(false);
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

          <div className="glass-surface rounded-2xl p-5 md:p-6 border-border mb-10">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">
                Órdenes
              </h2>
              <div className="flex items-center gap-3">
                {totalFiltered > 0 && (
                  <span className="text-xs text-muted">
                    {totalFiltered} {totalFiltered === 1 ? "orden" : "órdenes"}
                    {allOrders.length !== totalFiltered ? ` (filtrado de ${allOrders.length})` : ""}
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
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="text"
                placeholder="Buscar por orden, cliente, email o ciudad..."
                value={orderFilterQ}
                onChange={(e) => {
                  setOrderFilterQ(e.target.value);
                  setOrdersPage(1);
                }}
                className="input-theme border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted max-w-[280px] focus:border-gold/60 outline-none"
              />
              <select
                value={orderFilterStatus}
                onChange={(e) => {
                  setOrderFilterStatus(e.target.value);
                  setOrdersPage(1);
                }}
                className="input-theme border rounded-full px-4 py-2 text-sm text-foreground focus:border-gold/60 outline-none bg-background"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="SHIPPED">Enviado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              {(orderFilterQ.trim() || orderFilterStatus) && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderFilterQ("");
                    setOrderFilterStatus("");
                    setOrdersPage(1);
                  }}
                  className="text-xs text-muted hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            {exportError && (
              <p className="text-sm text-red-300 mb-3">{exportError}</p>
            )}
            {selectedOrderIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-3 p-3 rounded-xl bg-gold/10 border border-gold/30">
                <span className="text-sm text-foreground font-medium">
                  {selectedOrderIds.size} {selectedOrderIds.size === 1 ? "orden seleccionada" : "órdenes seleccionadas"}
                </span>
                <select
                  id="bulk-status"
                  className="input-theme border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-gold/60 outline-none bg-background"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Nuevo estado
                  </option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === "PENDING" ? "Pendiente" : s === "PAID" ? "Pagado" : s === "SHIPPED" ? "Enviado" : "Cancelado"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={bulkUpdating}
                  onClick={() => {
                    const sel = document.getElementById("bulk-status") as HTMLSelectElement | null;
                    const v = sel?.value as OrderStatusValue | "";
                    if (v && ORDER_STATUSES.includes(v)) handleBulkStatusChange(v);
                  }}
                  className="text-sm bg-gold text-background hover:bg-gold-light rounded-lg px-4 py-1.5 font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {bulkUpdating ? "Actualizando..." : "Aplicar a seleccionadas"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds(new Set())}
                  className="text-sm text-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
                >
                  Deseleccionar
                </button>
              </div>
            )}
            {ordersLoading ? (
              <p className="text-sm text-muted">Cargando órdenes...</p>
            ) : ordersToShow.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted">
                  {allOrders.length === 0
                    ? "Aún no hay órdenes registradas."
                    : "No hay órdenes que coincidan con los filtros."}
                </p>
                {allOrders.length === 0 && !ordersLoading && (
                  <button
                    type="button"
                    onClick={() => setRetryOrdersKey((k) => k + 1)}
                    className="text-xs text-gold hover:text-gold-light underline"
                  >
                    Reintentar carga
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-muted text-xs uppercase tracking-wider border-b border-border">
                        <th className="w-10 py-2.5 pr-0">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              ref={selectAllCheckboxRef}
                              type="checkbox"
                              checked={allOnPageSelected}
                              onChange={toggleSelectAllOnPage}
                              className="rounded border-border text-gold focus:ring-gold/50"
                            />
                            <span className="sr-only">Seleccionar todas en esta página</span>
                          </label>
                        </th>
                        <th className="text-left py-2.5 font-medium">Cliente</th>
                        <th className="text-left py-2.5 font-medium">Fecha</th>
                        <th className="text-left py-2.5 font-medium">Estado</th>
                        <th className="text-left py-2.5 font-medium">Productos</th>
                        <th className="text-right py-2.5 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersToShow.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border hover:bg-foreground/[0.03]"
                        >
                          <td className="w-10 py-2.5 pr-0">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.has(order.id)}
                              onChange={() => toggleSelectOrder(order.id)}
                              className="rounded border-border text-gold focus:ring-gold/50"
                            />
                          </td>
                          <td className="py-2.5">
                            <span className="text-foreground font-medium">{order.customerName}</span>
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
                            <div className="space-y-1.5">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleOrderStatusChange(
                                    order.id,
                                    e.target.value as OrderStatusValue,
                                    order.trackingNumber,
                                    order.trackingUrl
                                  )
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
                              {order.status === "SHIPPED" && (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Nº guía"
                                    value={order.trackingNumber ?? ""}
                                    onChange={(e) => updateOrderTracking(order.id, "trackingNumber", e.target.value)}
                                    className="block w-full input-theme border rounded-lg px-2 py-1 text-xs text-foreground focus:border-gold/60 outline-none"
                                  />
                                  <input
                                    type="url"
                                    placeholder="URL seguimiento"
                                    value={order.trackingUrl ?? ""}
                                    onChange={(e) => updateOrderTracking(order.id, "trackingUrl", e.target.value)}
                                    className="block w-full input-theme border rounded-lg px-2 py-1 text-xs text-foreground focus:border-gold/60 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleOrderStatusChange(order.id, "SHIPPED", order.trackingNumber, order.trackingUrl)}
                                    disabled={updatingOrderId === order.id}
                                    className="text-[10px] text-gold hover:text-gold-light disabled:opacity-50"
                                  >
                                    Guardar guía
                                  </button>
                                </>
                              )}
                            </div>
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
                {totalPages > 1 && ordersToShow.length > 0 && (
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted">
                      Mostrando {ordersPageStart + 1}–{Math.min(ordersPageStart + ORDERS_PAGE_SIZE, totalFiltered)} de {totalFiltered}
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
                        Página {ordersPage} de {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrdersPage((p) => p + 1)}
                        disabled={ordersPage >= totalPages}
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
                <div className="glass-surface rounded-2xl p-5 border-border">
                  <h2 className="text-sm font-semibold text-foreground mb-4">
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
                <div className="glass-surface rounded-2xl p-5 border-border">
                  <h2 className="text-sm font-semibold text-foreground mb-4">
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
                <div className="glass-surface rounded-2xl p-5 border-border lg:col-span-2">
                  <h2 className="text-sm font-semibold text-foreground mb-4">
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
        <div className="space-y-2">
          <p className="text-sm text-muted">No se pudo cargar el resumen.</p>
          {apiError && (
            <p className="text-xs text-red-300 font-mono break-all">{apiError}</p>
          )}
          <p className="text-xs text-muted">
            Comprueba que hayas iniciado sesión como administrador.{" "}
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="text-gold hover:text-gold-light underline"
            >
              Reintentar
            </button>
          </p>
        </div>
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
    <div className="glass-surface rounded-2xl p-5 md:p-6 border-border flex items-start gap-4">
      <div className="rounded-xl bg-gold/10 text-gold p-2.5 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted mb-1">{label}</p>
        <p className="text-xl md:text-2xl font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

