'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/components/cart/CartContext";
import { formatPriceCOP } from "@/lib/formatPrice";
import { SectionTitle } from "@/components/ui/SectionTitle";

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  price: { toString(): string };
  images: string[];
  stock: number;
  category?: { name: string; slug: string } | null;
};

export default function ListaDeseosPage() {
  const { productIds, remove } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const ids = productIds.join(",");
    fetch(`/api/products?ids=${encodeURIComponent(ids)}&pageSize=100`)
      .then((res) => res.json())
      .then((data) => {
        const items = data.items ?? [];
        const orderMap = new Map(productIds.map((id, i) => [id, i]));
        const sorted = [...items].sort(
          (a: ProductItem, b: ProductItem) =>
            (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
        );
        setProducts(sorted);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productIds]);

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Lista de deseos"
        title="Tus piezas guardadas"
        description="Productos que marcaste como favoritos. Añádelos al carrito cuando quieras."
      />

      {loading ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : products.length === 0 ? (
        <div className="glass-surface rounded-2xl p-12 text-center border-border">
          <Heart className="h-12 w-12 text-foreground-muted mx-auto mb-4" strokeWidth={1} />
          <p className="text-muted mb-2">Tu lista de deseos está vacía</p>
          <p className="text-sm text-muted mb-6">
            Explora el catálogo y haz clic en el corazón para guardar tus favoritos.
          </p>
          <Link
            href="/catalogo"
            className="btn-primary inline-flex items-center gap-2"
          >
            Ver colección
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const mainImage = product.images[0] ?? "/placeholder.png";
            return (
              <div
                key={product.id}
                className="group glass-surface rounded-2xl p-4 flex flex-col gap-3 border-border hover:border-gold/30 transition-all"
              >
                <Link href={`/producto/${product.slug}`} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-foreground/10 block">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-col gap-2 flex-1">
                  <p className="text-xs text-muted uppercase tracking-wider">
                    {product.category?.name ?? "Gold Legacy"}
                  </p>
                  <Link href={`/producto/${product.slug}`}>
                    <h3 className="font-medium text-white hover:text-gold transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gold font-semibold">
                    {formatPriceCOP(Number(product.price))}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {product.stock > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: Number(product.price),
                          image: mainImage
                        })
                      }
                      className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Añadir al carrito
                    </button>
                  ) : (
                    <span className="text-sm text-red-400">Agotado</span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="rounded-full p-2 border border-white/10 text-red-400/80 hover:text-red-400 hover:border-red-400/30 transition-colors"
                    title="Quitar de la lista"
                  >
                    <Heart className="h-4 w-4" fill="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
