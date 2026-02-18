/**
 * Formato corto de número de orden para mostrar al cliente (ej. "GL-A1B2C3D4").
 */
export function formatOrderNumber(orderId: string): string {
  if (!orderId || orderId.length < 8) return `GL-${orderId}`;
  return `GL-${orderId.slice(-8).toUpperCase()}`;
}
