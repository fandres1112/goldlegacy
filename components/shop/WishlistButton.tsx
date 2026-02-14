'use client';

import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

type Props = {
  productId: string;
  className?: string;
  size?: "sm" | "md";
};

export function WishlistButton({ productId, className = "", size = "md" }: Props) {
  const { has, toggle } = useWishlist();
  const isInWishlist = has(productId);

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={`rounded-full p-2 border transition-all duration-300 ${
        isInWishlist
          ? "bg-gold/20 text-gold border-gold/50 hover:bg-gold/30"
          : "bg-foreground/10 text-foreground-muted border-border hover:text-gold hover:border-gold/30 hover:bg-gold/5"
      } ${className}`}
      title={isInWishlist ? "Quitar de lista de deseos" : "Añadir a lista de deseos"}
    >
      <Heart
        className={iconSize}
        fill={isInWishlist ? "currentColor" : "none"}
        strokeWidth={1.75}
      />
    </button>
  );
}
