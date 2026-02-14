'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FolderTree } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [userChecked, setUserChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", isActive: true });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user?.role === "ADMIN") setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      } finally {
        setUserChecked(true);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (res.ok) setCategories(data.items ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", isActive: true });
    setError(null);
    setSuccess(null);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, isActive: c.isActive });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al actualizar");
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingId ? { ...cat, ...form } : cat))
        );
        setSuccess("Categoría actualizada.");
        setEditingId(null);
        setForm({ name: "", slug: "", isActive: true });
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al crear");
        setCategories((prev) => [...prev, { id: data.id, ...form }]);
        setSuccess("Categoría creada.");
        setForm({ name: "", slug: "", isActive: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Category) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error");
      }
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === c.id ? { ...cat, isActive: !cat.isActive } : cat
        )
      );
      if (editingId === c.id) setForm((f) => ({ ...f, isActive: !c.isActive }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  if (!userChecked) {
    return (
      <div className="container-page py-16 text-muted">Verificando sesión...</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-16">
        <p className="text-muted mb-4">No tienes acceso a esta página.</p>
        <Link href="/admin" className="btn-outline text-sm">
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-10">
      <div className="mb-8">
        <h1 className="heading-section text-2xl sm:text-3xl">
          Categorías
        </h1>
        <p className="text-sm text-muted mt-1">
          Las categorías inactivas no se muestran en el catálogo ni en filtros.
        </p>
      </div>

      <div className="glass-surface rounded-2xl p-5 md:p-6 border-white/10 mb-8">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          {editingId ? "Editar categoría" : "Nueva categoría"}
        </h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-muted mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: editingId ? f.slug : slugFromName(e.target.value)
                }))
              }
              className="w-full rounded-xl input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="Ej. Anillos"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Slug (URL)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-xl input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="anillos"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="form-isActive"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-white/20 text-gold focus:ring-gold/50"
            />
            <label htmlFor="form-isActive" className="text-sm text-muted">
              Activa (visible en catálogo)
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm"
            >
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={startCreate}
                className="btn-outline text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
        {(error || success) && (
          <p className={`mt-3 text-sm ${error ? "text-red-300" : "text-gold"}`}>
            {error ?? success}
          </p>
        )}
      </div>

      <div className="glass-surface rounded-2xl p-5 md:p-6 border-white/10 overflow-x-auto">
        <h2 className="text-base font-semibold text-white mb-4">Listado</h2>
        {loading ? (
          <p className="text-sm text-muted">Cargando...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted">No hay categorías. Crea una arriba.</p>
        ) : (
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left py-2.5 font-medium">Nombre</th>
                <th className="text-left py-2.5 font-medium">Slug</th>
                <th className="text-left py-2.5 font-medium">Estado</th>
                <th className="text-right py-2.5 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-white/5 hover:bg-white/[0.03]"
                >
                  <td className="py-2.5 text-white/95">{cat.name}</td>
                  <td className="py-2.5 text-muted">{cat.slug}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cat.isActive
                          ? "bg-gold/20 text-gold"
                          : "bg-white/10 text-muted"
                      }`}
                    >
                      {cat.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(cat)}
                      className="text-xs text-gold hover:text-gold-light mr-3"
                    >
                      {cat.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="text-xs text-white/70 hover:text-gold"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
