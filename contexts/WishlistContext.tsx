'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type WishlistContextValue = {
  productIds: string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const STORAGE_KEY = "goldlegacy_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setProductIds(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
    } catch {
      // ignore
    }
  }, [productIds]);

  const value: WishlistContextValue = useMemo(() => {
    const add = (productId: string) => {
      setProductIds((prev) =>
        prev.includes(productId) ? prev : [...prev, productId]
      );
    };
    const remove = (productId: string) => {
      setProductIds((prev) => prev.filter((id) => id !== productId));
    };
    const toggle = (productId: string) => {
      setProductIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );
    };
    const has = (productId: string) => productIds.includes(productId);
    return { productIds, add, remove, toggle, has };
  }, [productIds]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist debe usarse dentro de WishlistProvider");
  }
  return ctx;
}
