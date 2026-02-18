import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { formatPriceCOP } from "@/lib/formatPrice";

type ProductPageProps = {
  params: { slug: string };
};

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, images: true }
  });
  if (!product) {
    return { title: "Producto · Gold Legacy" };
  }
  const image = product.images[0];
  return {
    title: `${product.name} · Gold Legacy`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} · Gold Legacy`,
      description: product.description.slice(0, 160),
      ...(image && { images: [{ url: image, alt: product.name }] })
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true
    }
  });

  if (!product) {
    return notFound();
  }

  const mainImage = product.images[0] ?? "/placeholder.png";
  const secondaryImages = product.images.slice(1);

  return (
    <div className="container-page py-12 md:py-16">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-4 sticky top-24">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-b from-white/10 to-black/80 group">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 rounded-full bg-black/80 backdrop-blur-sm px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gold border border-gold/50 shadow-lg">
                Destacado
              </span>
            )}
          </div>
          {secondaryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {secondaryImages.map((img, index) => (
                <div
                  key={img + index}
                  className="relative aspect-square overflow-hidden rounded-xl bg-black/40 group cursor-pointer hover:border-gold border-2 border-transparent transition-all"
                >
                  <Image
                    src={img}
                    alt={`${product.name} alternativa ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 max-w-md">
          <div className="space-y-3 animate-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold-light">
                  {product.category?.name ?? "Colección Gold Legacy"}
                </p>
                <h1 className="heading-section text-3xl md:text-4xl">{product.name}</h1>
              </div>
              <WishlistButton productId={product.id} />
            </div>
            <p className="text-base text-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="glass-surface rounded-2xl p-5 space-y-3 border-gold/20">
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] text-gray-400 uppercase tracking-[0.1em]">Precio</p>
              <p className="text-3xl font-semibold text-gold">
                {formatPriceCOP(Number(product.price))}
              </p>
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Material</span>
                <span className="text-foreground">{product.material}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Disponibilidad</span>
                <span className={product.stock > 0 ? "text-emerald-400" : "text-red-400"}>
                  {product.stock > 0 ? `${product.stock} piezas disponibles` : "Agotado"}
                </span>
              </div>
            </div>
          </div>

          {product.stock > 0 ? (
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={Number(product.price)}
              image={mainImage}
            />
          ) : (
            <div className="glass-surface rounded-2xl p-4 border-red-500/20">
              <p className="text-sm text-red-400 text-center">
                Este producto se encuentra temporalmente agotado.
              </p>
            </div>
          )}

          <div className="glass-surface rounded-2xl p-5 border-border space-y-3 text-xs text-muted">
            <p className="text-foreground text-sm font-medium mb-2">Detalles de la pieza</p>
            <p>
              Cada pieza Gold Legacy es inspeccionada individualmente antes de ser enviada,
              asegurando consistencia en brillo, acabado y proporciones.
            </p>
            <p>
              Incluye estuche rígido negro con detalles en dorado, ideal para regalo o
              conservación a largo plazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

