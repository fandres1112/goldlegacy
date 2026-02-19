"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { formatOrderNumber } from "@/lib/formatOrderNumber";

function ErrorContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="container-page py-12 md:py-16 max-w-2xl">
      <div className="glass-surface rounded-2xl p-8 md:p-10 border-red-500/20 text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-red-500/15 text-red-400 items-center justify-center mb-6">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="heading-section mb-3">El pago no se completó</h1>
        {orderId && (
          <p className="text-foreground-muted text-sm mb-2">
            Orden: {formatOrderNumber(orderId)}
          </p>
        )}
        <p className="text-sm text-foreground mb-3">
          No se procesó el pago en Mercado Pago (cancelaste o hubo un error). Tu orden sigue registrada como pendiente; puedes intentar pagar de nuevo desde <Link href="/mis-ordenes" className="text-gold hover:text-gold-light">Mis órdenes</Link> o hacer un nuevo pedido.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/carrito" className="btn-primary text-sm">
            Volver al carrito
          </Link>
          <Link href="/catalogo" className="btn-outline text-sm">
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={
      <div className="container-page py-12 md:py-16 max-w-2xl">
        <div className="glass-surface rounded-2xl p-8 animate-pulse h-64" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
