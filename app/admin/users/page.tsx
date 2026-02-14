'use client';

import { useEffect, useState } from "react";
import { Users, Shield, User } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: { orders: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    setUpdatingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al actualizar");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar rol");
    } finally {
      setUpdatingId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted">
            Gestiona cuentas de administradores y clientes.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Cargando usuarios...</p>
      ) : (
        <div className="glass-surface rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-foreground-muted text-xs uppercase tracking-wider border-b border-border bg-foreground/[0.02]">
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Rol</th>
                  <th className="text-left py-3 px-4 font-medium">Órdenes</th>
                  <th className="text-left py-3 px-4 font-medium">Registro</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border hover:bg-foreground/[0.03]"
                  >
                    <td className="py-3 px-4">
                      <span className="text-foreground font-medium">{u.email}</span>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      {u.name || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-gold/15 text-gold"
                            : "bg-foreground/10 text-foreground-muted"
                        }`}
                      >
                        {u.role === "ADMIN" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {u.role === "ADMIN" ? "Administrador" : "Cliente"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground-muted">
                      {u._count.orders}
                    </td>
                    <td className="py-3 px-4 text-foreground-muted text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as "USER" | "ADMIN")
                        }
                        disabled={
                          updatingId === u.id ||
                          (u.role === "ADMIN" && adminCount <= 1)
                        }
                        className="input-theme border rounded-lg px-2 py-1.5 text-xs text-foreground focus:border-gold/60 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="USER">Cliente</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                      {u.role === "ADMIN" && adminCount <= 1 && (
                        <p className="text-[10px] text-foreground-muted mt-1">
                          Debe haber al menos un admin
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-12 text-center text-sm text-muted">
              No hay usuarios registrados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
