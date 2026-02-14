'use client';

import { ProductType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function FiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`/catalogo?${params.toString()}`);
    });
  };

  const currentType = searchParams.get("type") ?? "";

  return (
    <div className="glass-surface rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 text-xs md:text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted uppercase tracking-[0.2em] text-[10px]">
          Tipo
        </span>
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="Todos"
            active={!currentType}
            onClick={() => handleChange("type", null)}
          />
          <FilterPill
            label="Cadenas"
            active={currentType === ProductType.CHAIN}
            onClick={() => handleChange("type", ProductType.CHAIN)}
          />
          <FilterPill
            label="Anillos"
            active={currentType === ProductType.RING}
            onClick={() => handleChange("type", ProductType.RING)}
          />
          <FilterPill
            label="Pulseras"
            active={currentType === ProductType.BRACELET}
            onClick={() => handleChange("type", ProductType.BRACELET)}
          />
          <FilterPill
            label="Aretes"
            active={currentType === ProductType.EARRING}
            onClick={() => handleChange("type", ProductType.EARRING)}
          />
        </div>
      </div>
      <div className="ml-auto text-[11px] text-gray-500">
        {isPending ? "Actualizando..." : "Filtra por tipo para refinar la colección."}
      </div>
    </div>
  );
}

type PillProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function FilterPill({ label, active, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 border text-xs transition-colors ${
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-border text-foreground-muted hover:border-gold/60 hover:text-gold"
      }`}
    >
      {label}
    </button>
  );
}

