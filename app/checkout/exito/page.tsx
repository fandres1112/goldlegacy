"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { formatOrderNumber } from "@/lib/formatOrderNumber";

function ExitoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="container-page py-12 md:py-16 max-w-2xl">
      <div className="glass-surface rounded-2xl p-8 md:p-10 border-gold/20 text-center">
        <div className="inline-flex h-14 w-14 rounded-full bg-gold/15 text-gold items-center justify-center mb-6">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="heading-section mb-3">¡Pago recibido!</h1>
        {orderId && (
          <p className="text-gold font-semibold text-sm mb-2">
            Tu orden: {formatOrderNumber(orderId)}
          </p>
        )}
        <p className="text-sm text-foreground mb-3">
          Mercado Pago confirmó tu pago. En Gold Legacy revisamos cada pieza y tu dirección para que todo llegue perfecto.
        </p>
        <p className="text-muted text-sm mb-4">
          Recibirás un correo con el resumen de tu compra. Si tienes dudas, indica tu número de orden al contactarnos.
        </p>
        <Link href="/catalogo" className="btn-outline inline-block text-sm">
          Seguir explorando
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutExitoPage() {
  return (
    <Suspense fallback={
      <div className="container-page py-12 md:py-16 max-w-2xl">
        <div className="glass-surface rounded-2xl p-8 animate-pulse h-64" />
      </div>
    }>
      <ExitoContent />
    </Suspense>
  );
}
