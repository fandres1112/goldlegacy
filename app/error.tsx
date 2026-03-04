"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-20 md:py-28 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="text-[11px] uppercase tracking-[0.25em] text-gold/90 mb-4">
        Algo salió mal
      </p>
      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight mb-4">
        Error inesperado
      </h1>
      <p className="text-foreground-muted text-base max-w-md mb-8">
        Ha ocurrido un error. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-gold text-background font-medium px-6 py-3 hover:bg-gold-light transition-colors"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-gold/50 text-gold font-medium px-6 py-3 hover:bg-gold/10 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
