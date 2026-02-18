import nodemailer from "nodemailer";
import { formatPriceCOP } from "./formatPrice";
import { formatOrderNumber } from "./formatOrderNumber";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM ?? "Gold Legacy <noreply@goldlegacy.com>";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

export type OrderEmailData = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  createdAt: Date;
  items: Array<{
    product: { name: string };
    quantity: number;
    unitPrice: number;
  }>;
};

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const dateStr = new Date(data.createdAt).toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short"
  });
  const lines = data.items.map(
    (i) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${i.product.name}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatPriceCOP(Number(i.unitPrice))}</td></tr>`
  ).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Confirmación de orden</title></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;background:#fafafa">
  <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 8px">Gold Legacy</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px">Confirmación de tu orden</p>
    <p style="margin:0 0 16px">Hola <strong>${data.customerName}</strong>,</p>
    <p style="margin:0 0 24px">Recibimos tu pedido correctamente. Resumen:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f9f9f9;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#1a1a1a;color:#fff">
          <th style="padding:10px 12px;text-align:left;font-size:12px">Producto</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px">Cant.</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px">Precio</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
    </table>
    <p style="margin:0 0 4px"><strong>Total:</strong> ${formatPriceCOP(data.total)}</p>
    <p style="margin:0 0 4px"><strong>Envío a:</strong> ${data.shippingAddress}, ${data.shippingCity}</p>
    <p style="margin:16px 0 0;font-size:12px;color:#888">Orden ${formatOrderNumber(data.id)} · ${dateStr}</p>
    <p style="margin:24px 0 0;font-size:14px;color:#666">Gracias por confiar en Gold Legacy.</p>
  </div>
</body>
</html>`;
}

/**
 * Envía email de confirmación de orden al cliente.
 * Si SMTP no está configurado o falla el envío, no lanza error (solo registra en consola).
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS). No se envió confirmación.");
    return;
  }

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: data.customerEmail,
      subject: `Gold Legacy – Confirmación de orden ${formatOrderNumber(data.id)}`,
      html: buildOrderConfirmationHtml(data),
      text: `Gold Legacy – Hola ${data.customerName}, recibimos tu pedido. Total: ${formatPriceCOP(data.total)}. Envío a: ${data.shippingAddress}, ${data.shippingCity}. Orden ${formatOrderNumber(data.id)}.`
    });
  } catch (err) {
    console.error("[email] Error al enviar confirmación de orden:", err);
  }
}
