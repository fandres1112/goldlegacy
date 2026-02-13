'use client';

import { useEffect, useState } from "react";

type ProductTypeValue = "CHAIN" | "RING" | "BRACELET" | "EARRING" | "PENDANT";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  material: string;
  type: ProductTypeValue;
  stock: number;
  isFeatured: boolean;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const typeOptions: { value: ProductTypeValue; label: string }[] = [
  { value: "CHAIN", label: "Cadena" },
  { value: "RING", label: "Anillo" },
  { value: "BRACELET", label: "Pulsera" },
  { value: "EARRING", label: "Arete" },
  { value: "PENDANT", label: "Dije" }
];

const initialForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  material: "",
  type: "CHAIN" as ProductTypeValue,
  stock: "",
  isFeatured: false,
  categoryId: "",
  image1: "",
  image2: ""
};

export default function AdminProductsPage() {
  const [userChecked, setUserChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user && data.user.role === "ADMIN") {
          setIsAdmin(true);
        }
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
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products?page=1&pageSize=100"),
          fetch("/api/categories")
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        setProducts(productsData.items ?? []);
        setCategories(categoriesData.items ?? []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingSlug(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const images = [form.image1, form.image2].filter(Boolean);

    if (images.length === 0) {
      setError("Debes añadir al menos una URL de imagen.");
      return;
    }

    const payload: any = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      price: Number(form.price),
      material: form.material,
      type: form.type,
      images,
      stock: Number(form.stock),
      isFeatured: form.isFeatured,
      categoryId: form.categoryId || undefined
    };

    try {
      const method = editingSlug ? "PATCH" : "POST";
      const url = editingSlug
        ? `/api/products/${encodeURIComponent(editingSlug)}`
        : "/api/products";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar el producto");
      }

      setSuccess(
        editingSlug
          ? "Producto actualizado correctamente."
          : "Producto creado correctamente."
      );

      // refrescar lista
      const productsRes = await fetch("/api/products?page=1&pageSize=100");
      const productsData = await productsRes.json();
      setProducts(productsData.items ?? []);

      resetForm();
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al guardar el producto.");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingSlug(product.slug);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(Number(product.price)),
      material: product.material,
      type: product.type,
      stock: String(product.stock),
      isFeatured: product.isFeatured,
      categoryId: product.categoryId ?? "",
      image1: product.images?.[0] ?? "",
      image2: product.images?.[1] ?? ""
    } as any);
  };

  const handleDelete = async (product: Product) => {
    const ok = window.confirm(
      `¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(product.slug)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo eliminar el producto");
      }
      setSuccess("Producto eliminado.");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (editingSlug === product.slug) {
        resetForm();
      }
    } catch (err: any) {
      setError(err.message ?? "Error inesperado al eliminar el producto.");
    }
  };

  if (!userChecked) {
    return (
      <div className="container-page py-12 md:py-16 text-sm text-muted">
        Verificando sesión...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-12 md:py-16 text-sm text-muted">
        No tienes permiso para acceder a la gestión de productos.
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16 grid lg:grid-cols-[2fr,1.2fr] gap-10 items-start text-sm">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-light/80">
              Productos
            </p>
            <h1 className="heading-section text-base md:text-2xl">
              Inventario Gold Legacy
            </h1>
          </div>
        </div>

        <div className="glass-surface rounded-2xl border border-white/5 overflow-hidden">
          <div className="border-b border-white/5 px-4 py-2 flex justify-between text-xs text-muted">
            <span>Nombre</span>
            <span className="w-40 text-right">Tipo / Stock</span>
          </div>
          {loading ? (
            <div className="p-4 text-xs text-muted">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-xs text-muted">
              Aún no hay productos creados.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-white/5"
                >
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {product.slug} ·{" "}
                      {categories.find((c) => c.id === product.categoryId)?.name ??
                        "Sin categoría"}
                    </p>
                  </div>
                  <div className="w-40 text-right text-[11px] text-muted">
                    <p>
                      {typeOptions.find((t) => t.value === product.type)?.label} ·{" "}
                      {product.stock} u.
                    </p>
                    <p className="text-gold font-semibold text-xs">
                      {Number(product.price).toFixed(2)} USD
                    </p>
                  </div>
                  <div className="flex gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="px-2 py-1 rounded-full border border-white/15 hover:border-gold/70"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="px-2 py-1 rounded-full border border-red-500/40 text-red-300 hover:border-red-400 hover:text-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="glass-surface rounded-2xl border border-white/5 p-5 space-y-4">
        <div>
          <p className="text-gray-200 mb-1">
            {editingSlug ? "Editar producto" : "Nuevo producto"}
          </p>
          <p className="text-xs text-muted">
            Completa los campos y guarda para actualizar el catálogo en tiempo
            real.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-emerald-300">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-muted">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-muted">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required={!editingSlug}
              className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-muted">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
              rows={3}
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-muted">Precio (USD)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-muted">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
                className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-muted">Material</label>
              <input
                value={form.material}
                onChange={(e) =>
                  setForm({ ...form, material: e.target.value })
                }
                required
                className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-muted">Tipo</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ProductTypeValue })
                }
                className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-muted">Categoría</label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
              className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-muted">Imagen principal (URL)</label>
            <input
              value={form.image1}
              onChange={(e) => setForm({ ...form, image1: e.target.value })}
              required
              className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-muted">Imagen secundaria (URL opcional)</label>
            <input
              value={form.image2}
              onChange={(e) => setForm({ ...form, image2: e.target.value })}
              className="w-full rounded-full bg-black/40 border border-white/10 px-3 py-1.5 outline-none focus:border-gold/80"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              id="featured"
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
              className="h-3 w-3 rounded border-white/20 bg-black/60"
            />
            <label htmlFor="featured" className="text-xs text-muted">
              Marcar como producto destacado
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary text-xs">
              {editingSlug ? "Guardar cambios" : "Crear producto"}
            </button>
            {editingSlug && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-outline text-xs"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
}

