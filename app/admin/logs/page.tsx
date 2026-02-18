'use client';

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";

type AuditLogEntry = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  PRODUCT_CREATE: "Producto creado",
  PRODUCT_UPDATE: "Producto actualizado",
  PRODUCT_DELETE: "Producto eliminado",
  PRODUCT_BULK: "Carga masiva de productos",
  CATEGORY_CREATE: "Categoría creada",
  CATEGORY_UPDATE: "Categoría actualizada",
  ORDER_STATUS_UPDATE: "Estado de orden actualizado"
};

const PAGE_SIZE = 20;

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/logs?page=${page}&pageSize=${PAGE_SIZE}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.ok) {
          setLogs(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mb-8">
        <h1 className="heading-section text-2xl sm:text-3xl flex items-center gap-2">
          <ScrollText className="h-8 w-8 text-gold" />
          Registro de actividad
        </h1>
        <p className="text-muted text-sm mt-1">
          Acciones realizadas en el panel: inicios de sesión, productos y categorías (crear/editar/eliminar), órdenes y carga masiva.
        </p>
      </div>

      <div className="glass-surface rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted text-sm">
            Cargando registros...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">
            Aún no hay registros de actividad.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-muted text-xs uppercase tracking-wider border-b border-border bg-foreground/[0.02]">
                    <th className="text-left py-3 px-4 font-medium">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium">Acción</th>
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border hover:bg-foreground/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 text-muted whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("es", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gold/90 font-medium">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">
                        {log.user?.email ?? log.user?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-muted max-w-xs truncate">
                        {log.details && typeof log.details === "object"
                          ? Object.entries(log.details)
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border text-xs text-muted">
                <span>
                  Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="text-gold hover:text-gold-light disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="text-gold hover:text-gold-light disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
