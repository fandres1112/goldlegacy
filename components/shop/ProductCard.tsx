import Link from "next/link";
import Image from "next/image";
import { Product } from "@prisma/client";
import { formatPriceCOP } from "@/lib/formatPrice";
import { WishlistButton } from "./WishlistButton";

type Props = {
  product: Product & {
    category?: {
      name: string;
      slug: string;
    } | null;
  };
};

export function ProductCard({ product }: Props) {
  const mainImage = product.images[0] ?? "/placeholder.png";

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative overflow-hidden rounded-2xl glass-surface p-3 flex flex-col gap-3 hover:border-gold/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-gold-soft"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-b from-white/10 to-black/80">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300" />
        {product.isFeatured && (
          <span className="absolute top-3 left-3 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gold border border-gold/50 shadow-lg group-hover:border-gold group-hover:bg-gold/10 transition-all">
            Destacado
          </span>
        )}
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton productId={product.id} size="sm" />
        </div>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 right-3 rounded-full bg-gold/90 backdrop-blur-sm p-2 text-black shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1">
        <p className="text-xs text-foreground-muted uppercase tracking-[0.2em] group-hover:text-gold-light transition-colors">
          {product.category?.name ?? "Colección Gold Legacy"}
        </p>
        <h3 className="text-base font-medium line-clamp-2 group-hover:text-gold transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted line-clamp-2">
          {product.description}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-gold font-semibold text-base">
            {formatPriceCOP(Number(product.price))}
          </span>
        </p>
      </div>
    </Link>
  );
}

