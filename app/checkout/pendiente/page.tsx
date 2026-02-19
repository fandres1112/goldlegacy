"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { formatOrderNumber } from "@/lib/formatOrderNumber";

function PendienteContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="container-page py-12 md:py-16 max-w-2xl">
      <div className="glass-surface rounded-2xl p-8 md:p-10 border-border text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-amber-500/15 text-amber-400 items-center justify-center mb-6">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="heading-section mb-3">Pago pendiente</h1>
        {orderId && (
          <p className="text-foreground font-semibold text-sm mb-2">
            Orden: {formatOrderNumber(orderId)}
          </p>
        )}
        <p className="text-sm text-foreground mb-3">
          Tu pago está en proceso (por ejemplo, transferencia o método en cuotas). Cuando Mercado Pago lo confirme, te enviaremos un correo y actualizaremos el estado de tu orden.
        </p>
        <p className="text-muted text-sm mb-4">
          Puedes ver el estado en <Link href="/mis-ordenes" className="text-gold hover:text-gold-light">Mis órdenes</Link> si iniciaste sesión.
        </p>
        <Link href="/catalogo" className="btn-outline inline-block text-sm">
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutPendientePage() {
  return (
    <Suspense fallback={
      <div className="container-page py-12 md:py-16 max-w-2xl">
        <div className="glass-surface rounded-2xl p-8 animate-pulse h-64" />
      </div>
    }>
      <PendienteContent />
    </Suspense>
  );
}
