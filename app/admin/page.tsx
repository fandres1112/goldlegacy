'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type Summary = {
  productsCount: number;
  ordersCount: number;
  usersCount: number;
  totalRevenue: number;
  latestOrders: Array<{
    id: string;
    total: number;
    createdAt: string;
    customerName: string;
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      product: {
        name: string;
      };
    }>;
  }>;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    email: "admin@goldlegacy.com",
    password: "admin1234"
  });

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo iniciar sesión");
      }
      setUser(data.user);
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message ?? "Error al iniciar sesión");
    }
  };

  if (loadingUser) {
    return (
      <div className="container-page py-12 md:py-16 text-sm text-muted">
        Verificando sesión...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container-page py-12 md:py-16 max-w-md">
        <h1 className="heading-section mb-2">Panel administrativo</h1>
        <p className="text-muted text-sm mb-6">
          Inicia sesión como administrador para gestionar la colección, inventario y
          órdenes de Gold Legacy.
        </p>
        <form onSubmit={handleLogin} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials((prev) => ({ ...prev, password: e.target.value }))
              }
              className="w-full rounded-full bg-black/40 border border-white/10 px-4 py-2 text-sm outline-none focus:border-gold/80"
            />
          </div>
          {loginError && (
            <p className="text-xs text-red-300">{loginError}</p>
          )}
          <button type="submit" className="btn-primary">
            Iniciar sesión
          </button>
        </form>
        <p className="mt-4 text-[11px] text-muted">
          Usuario demo creado por defecto: <span className="text-gold">admin@goldlegacy.com</span> /{" "}
          <span className="text-gold">admin1234</span>
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-light/80">
            Panel admin
          </p>
          <h1 className="heading-section">
            Bienvenido, {user.name ?? "Administrador"}
          </h1>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="btn-outline"
          >
            Gestionar productos
          </button>
        </div>
      </div>

      {summaryLoading && !summary ? (
        <p className="text-sm text-muted">Cargando resumen...</p>
      ) : summary ? (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-10 text-sm">
            <AdminStat label="Productos" value={summary.productsCount} />
            <AdminStat label="Órdenes" value={summary.ordersCount} />
            <AdminStat label="Clientes" value={summary.usersCount} />
            <AdminStat
              label="Ingresos totales"
              value={`${summary.totalRevenue.toString()} USD`}
            />
          </div>

          <div className="glass-surface rounded-2xl p-6 border-white/5 text-sm">
            <p className="text-gray-200 mb-3">Últimas órdenes</p>
            {summary.latestOrders.length === 0 ? (
              <p className="text-muted text-xs">
                Aún no hay órdenes registradas.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {summary.latestOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-white/5 rounded-xl px-3 py-2 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-gray-200">
                        {order.customerName}
                      </p>
                      <p className="text-muted">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="text-muted mt-1">
                        {order.items.map((item) => item.product.name).join(" · ")}
                      </p>
                    </div>
                    <p className="text-gold font-semibold">
                      {order.total.toString()} USD
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted">No se pudo cargar el resumen.</p>
      )}
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-surface rounded-2xl p-4 border-white/5">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

