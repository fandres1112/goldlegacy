'use client';

import { useEffect, useState, useMemo } from "react";
import { List, Plus, Pencil, Upload } from "lucide-react";
import { formatPriceCOP } from "@/lib/formatPrice";

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
  images?: string[];
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
  isActive?: boolean;
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

const PAGE_SIZE = 10;

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
  const [tab, setTab] = useState<"list" | "form" | "bulk">("list");
  const [listPage, setListPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; total: number; errors: Array<{ row: number; message: string }> } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user && data.user.role === "ADMIN") setIsAdmin(true);
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
          fetch("/api/products?page=1&pageSize=500"),
          fetch("/api/admin/categories")
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

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (listPage - 1) * PAGE_SIZE,
        listPage * PAGE_SIZE
      ),
    [filteredProducts, listPage]
  );

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
    const payload = {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el producto");
      setSuccess(editingSlug ? "Producto actualizado." : "Producto creado.");
      const productsRes = await fetch("/api/products?page=1&pageSize=500");
      const productsData = await productsRes.json();
      setProducts(productsData.items ?? []);
      resetForm();
      setTab("list");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    }
  };

  const downloadBulkTemplate = async () => {
    try {
      const res = await fetch("/api/admin/products/bulk/template", { credentials: "include" });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla-productos-goldlegacy.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setBulkError("No se pudo descargar la plantilla.");
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      setBulkError("Selecciona un archivo Excel.");
      return;
    }
    setBulkError(null);
    setBulkResult(null);
    setBulkLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error ?? "Error en la carga masiva");
        return;
      }
      setBulkResult({ created: data.created, total: data.total, errors: data.errors ?? [] });
      setBulkFile(null);
      const productsRes = await fetch("/api/products?page=1&pageSize=500");
      const productsData = await productsRes.json();
      setProducts(productsData.items ?? []);
    } finally {
      setBulkLoading(false);
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
      image1: (product as Product).images?.[0] ?? "",
      image2: (product as Product).images?.[1] ?? ""
    });
    setTab("form");
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? No se puede deshacer.`)) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.slug)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo eliminar");
      setSuccess("Producto eliminado.");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (editingSlug === product.slug) resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  const goToNewProduct = () => {
    resetForm();
    setTab("form");
  };

  if (!userChecked) {
    return (
      <div className="container-page py-12 text-sm text-muted">Verificando sesión...</div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="container-page py-12 text-sm text-muted">No tienes permiso para acceder.</div>
    );
  }

  return (
    <div className="container-page py-8 md:py-10">
      <div className="mb-6">
        <h1 className="heading-section text-2xl sm:text-3xl">Productos</h1>
        <p className="text-sm text-muted mt-1">Inventario y alta/edición de piezas.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-6">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "list" ? "bg-white/10 text-gold border border-white/10 border-b-0 -mb-px" : "text-muted hover:text-white"
          }`}
        >
          <List className="h-4 w-4" /> Listado ({products.length})
        </button>
        <button
          type="button"
          onClick={goToNewProduct}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "form" ? "bg-white/10 text-gold border border-white/10 border-b-0 -mb-px" : "text-muted hover:text-white"
          }`}
        >
          <Plus className="h-4 w-4" /> {editingSlug ? "Editar producto" : "Nuevo producto"}
        </button>
        <button
          type="button"
          onClick={() => { setTab("bulk"); setBulkResult(null); setBulkError(null); setBulkFile(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
            tab === "bulk" ? "bg-white/10 text-gold border border-white/10 border-b-0 -mb-px" : "text-muted hover:text-white"
          }`}
        >
          <Upload className="h-4 w-4" /> Carga masiva
        </button>
      </div>

      {tab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <input
              type="search"
              placeholder="Buscar por nombre o slug..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setListPage(1);
              }}
              className="w-full sm:max-w-xs rounded-xl input-theme border px-4 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
            />
            <span className="text-sm text-muted">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? "s" : ""}
              {searchQuery && ` (filtrados)`}
            </span>
          </div>

          <div className="glass-surface rounded-2xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-8 text-sm text-muted text-center">Cargando productos...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-sm text-muted text-center">
                {searchQuery ? "Ningún producto coincide con la búsqueda." : "Aún no hay productos. Crea uno en la pestaña «Nuevo producto»."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-muted text-xs uppercase tracking-wider border-b border-white/10 bg-white/[0.02]">
                        <th className="text-left py-3 px-4 font-medium">Producto</th>
                        <th className="text-left py-3 px-4 font-medium">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium">Categoría</th>
                        <th className="text-right py-3 px-4 font-medium">Stock</th>
                        <th className="text-right py-3 px-4 font-medium">Precio</th>
                        <th className="text-right py-3 px-4 font-medium w-28">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                          <td className="py-3 px-4">
                            <p className="font-medium text-white">{product.name}</p>
                            <p className="text-xs text-muted">{product.slug}</p>
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {typeOptions.find((t) => t.value === product.type)?.label ?? product.type}
                          </td>
                          <td className="py-3 px-4 text-muted">
                            {categories.find((c) => c.id === product.categoryId)?.name ?? "—"}
                          </td>
                          <td className="py-3 px-4 text-right text-muted">{product.stock} u.</td>
                          <td className="py-3 px-4 text-right text-gold font-medium">
                            {formatPriceCOP(Number(product.price))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="p-1.5 rounded-lg border border-white/15 hover:border-gold/50 hover:text-gold transition-colors"
                                title="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product)}
                                className="text-xs px-2 py-1 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-sm text-muted">
                    <span>
                      Página {listPage} de {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        disabled={listPage <= 1}
                        className="px-3 py-1 rounded-lg border border-white/10 hover:border-gold/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                        disabled={listPage >= totalPages}
                        className="px-3 py-1 rounded-lg border border-white/10 hover:border-gold/50 disabled:opacity-40 disabled:cursor-not-allowed"
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
      )}

      {tab === "form" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6 items-start">
          <div className="glass-surface rounded-2xl border border-white/10 p-4 md:p-5">
            {(error || success) && (
              <p className={`text-xs mb-3 ${error ? "text-red-300" : "text-emerald-300"}`}>
                {error ?? success}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <section>
              <h2 className="text-sm font-semibold text-white mb-2">Datos básicos</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required={!editingSlug}
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <label className="block text-xs text-muted">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 resize-none text-foreground"
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white mb-2">Precio e inventario</h2>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Precio (COP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Material</label>
                  <input
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    required
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ProductTypeValue })}
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Categoría</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}{cat.isActive === false ? " (inactiva)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white mb-2">Imágenes</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Imagen principal (URL)</label>
                  <input
                    value={form.image1}
                    onChange={(e) => setForm({ ...form, image1: e.target.value })}
                    required
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-muted">Imagen secundaria (URL opcional)</label>
                  <input
                    value={form.image2}
                    onChange={(e) => setForm({ ...form, image2: e.target.value })}
                    className="w-full rounded-lg input-theme border px-3 py-2 text-sm outline-none focus:border-gold/80 text-foreground"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center gap-3 pt-1">
              <input
                id="featured"
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="rounded border-white/20 text-gold focus:ring-gold/50 h-3.5 w-3.5"
              />
              <label htmlFor="featured" className="text-xs text-muted">Marcar como producto destacado</label>
            </div>

            <div className="flex gap-2 pt-3">
              <button type="submit" className="btn-primary text-sm">
                {editingSlug ? "Guardar cambios" : "Crear producto"}
              </button>
              {editingSlug && (
                <button type="button" onClick={() => { resetForm(); setTab("list"); }} className="btn-outline text-sm">
                  Cancelar
                </button>
              )}
            </div>
          </form>
          </div>

          {/* Vista previa */}
          <div className="lg:sticky lg:top-6 glass-surface rounded-2xl border border-white/10 p-4 overflow-hidden">
            <p className="text-xs uppercase tracking-wider text-muted mb-3">Vista previa</p>
            <div className="rounded-xl border border-border overflow-hidden bg-foreground/10">
              <div className="aspect-[4/5] relative bg-white/5">
                {form.image1 && form.image1.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image1}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                    {form.image1 ? "URL no válida" : "Imagen principal"}
                  </div>
                )}
                {form.isFeatured && (
                  <span className="absolute top-2 left-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold border border-gold/50">
                    Destacado
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-[10px] text-muted uppercase tracking-wider">
                  {form.categoryId
                    ? categories.find((c) => c.id === form.categoryId)?.name ?? "Categoría"
                    : "Sin categoría"}
                </p>
                <h3 className="font-medium text-white text-sm line-clamp-2">
                  {form.name || "Nombre del producto"}
                </h3>
                <p className="text-xs text-muted line-clamp-2">
                  {form.description || "Descripción breve."}
                </p>
                <p className="text-gold font-semibold text-sm pt-1">
                  {form.price ? formatPriceCOP(Number(form.price)) : "— COP"}
                </p>
                <p className="text-[10px] text-muted">
                  {typeOptions.find((t) => t.value === form.type)?.label ?? form.type}
                  {form.material && ` · ${form.material}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "bulk" && (
        <div className="glass-surface rounded-2xl border border-white/10 p-6 md:p-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-2">Carga masiva de productos</h2>
          <p className="text-sm text-muted mb-4">
            Sube un archivo Excel (.xlsx) con una fila de encabezados y una fila por producto. Usa la plantilla para ver el formato.
          </p>
          <div className="mb-4">
            <button
              type="button"
              onClick={downloadBulkTemplate}
              className="text-sm text-gold hover:text-gold-light border border-gold/40 hover:border-gold/60 rounded-lg px-3 py-2 transition-colors"
            >
              Descargar plantilla Excel
            </button>
          </div>
          <p className="text-xs text-muted mb-4">
            Columnas (español): <strong>nombre</strong>, <strong>slug</strong> (opcional), <strong>descripcion</strong>, <strong>precio</strong> (COP), <strong>material</strong>, <strong>tipo</strong> (Cadena, Anillo, Pulsera, Arete, Dije), <strong>stock</strong>, <strong>destacado</strong> (true/false), <strong>categoria</strong> (slug de categoría), <strong>imagen1</strong>, <strong>imagen2</strong> (opcional). La hoja «Opciones» lista los tipos y categorías activas.
          </p>
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1">Archivo Excel (.xlsx)</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold/40 file:bg-gold/10 file:text-gold"
              />
            </div>
            {bulkError && <p className="text-sm text-red-300">{bulkError}</p>}
            {bulkResult && (
              <div className="rounded-lg border border-white/10 p-3 text-sm">
                <p className="text-emerald-300 font-medium">
                  {bulkResult.created} de {bulkResult.total} productos creados correctamente.
                </p>
                {bulkResult.errors.length > 0 && (
                  <div className="mt-2 text-amber-200">
                    <p className="font-medium mb-1">Errores por fila:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {bulkResult.errors.slice(0, 15).map((err, idx) => (
                        <li key={idx}>Fila {err.row}: {err.message}</li>
                      ))}
                      {bulkResult.errors.length > 15 && (
                        <li>… y {bulkResult.errors.length - 15} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={bulkLoading || !bulkFile}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {bulkLoading ? "Procesando..." : "Cargar productos"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
