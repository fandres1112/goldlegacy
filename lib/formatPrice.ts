/**
 * Precios en COP (pesos colombianos).
 */

/** Formatea un monto en COP (ej. 760000 → "760.000 COP") */
export function formatPriceCOP(amount: number): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "— COP";
  return `${value.toLocaleString("es-CO")} COP`;
}
