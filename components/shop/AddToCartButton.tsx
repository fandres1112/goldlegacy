'use client';

import { useState, useTransition } from "react";
import { useCart } from "@/components/cart/CartContext";
import { toast } from "@/components/ui/Toast";
import { ShoppingCart, Check } from "lucide-react";

type Props = {
  productId: string;
  name: string;
  price: number;
  image?: string;
};

export function AddToCartButton({ productId, name, price, image }: Props) {
  const { addItem } = useCart();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    startTransition(() => {
      addItem({ productId, name, price, image }, 1);
      setAdded(true);
      toast(`${name} agregado al carrito`, "success");
      setTimeout(() => setAdded(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || added}
      className="btn-primary w-full md:w-auto relative overflow-hidden group"
    >
      <span className="flex items-center gap-2 relative z-10">
        {added ? (
          <>
            <Check className="h-4 w-4" />
            <span>Agregado</span>
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{isPending ? "Agregando..." : "Agregar al carrito"}</span>
          </>
        )}
      </span>
      {added && (
        <span className="absolute inset-0 bg-emerald-600/20 animate-in fade-in duration-300" />
      )}
    </button>
  );
}

