import nodemailer from "nodemailer";
import { formatPriceCOP } from "./formatPrice";
import { formatOrderNumber } from "./formatOrderNumber";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 2525;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM ?? "Gold Legacy <noreply@goldlegacy.com>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

const EMAIL_STYLES = {
  wrapper: "margin:0;padding:32px 16px;background:#0f1419;font-family:Georgia,'Times New Roman',serif",
  card: "max-width:520px;margin:0 auto;background:#fffdf9;border-radius:2px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.24)",
  cardInner: "padding:40px 36px",
  logo: "font-size:26px;letter-spacing:0.2em;color:#1a1814;margin:0;font-weight:400;text-transform:uppercase",
  tagline: "font-size:10px;letter-spacing:0.28em;color:#b1891f;margin:6px 0 0 0;text-transform:uppercase",
  goldLine: "height:1px;background:linear-gradient(90deg,transparent,#d4af37 20%,#d4af37 80%,transparent);margin:24px 0;border:0",
  heading: "font-size:14px;letter-spacing:0.12em;color:#5c5854;margin:0 0 8px 0;text-transform:uppercase",
  title: "font-size:20px;color:#1a1814;margin:0 0 20px 0;font-weight:400;font-family:Georgia,serif",
  body: "font-size:15px;line-height:1.6;color:#3d3935;margin:0 0 16px 0;font-family:'Segoe UI',system-ui,sans-serif",
  tableWrap: "margin:28px 0;border:1px solid #e8e4dc;border-radius:2px",
  tableHead: "background:#1a1814;color:#fffdf9;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:400;padding:14px 16px;text-align:left;border-bottom:2px solid #d4af37",
  tableCell: "padding:14px 16px;border-bottom:1px solid #e8e4dc;font-size:14px;color:#3d3935;font-family:'Segoe UI',system-ui,sans-serif",
  totalRow: "background:#faf8f5;font-weight:600;color:#1a1814;font-size:15px",
  footerLine: "height:1px;background:#e8e4dc;margin:28px 0 20px 0;border:0",
  footerText: "font-size:12px;color:#8a8580;margin:0;font-family:'Segoe UI',system-ui,sans-serif",
  footerBrand: "font-size:11px;letter-spacing:0.2em;color:#b1891f;margin:4px 0 0 0;text-transform:uppercase",
  btn: "display:inline-block;padding:14px 28px;background:#1a1814;color:#fffdf9;text-decoration:none;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;border:1px solid #1a1814",
  link: "color:#b1891f;text-decoration:none;font-weight:500"
};

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const dateStr = new Date(data.createdAt).toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short"
  });
  const orderNum = formatOrderNumber(data.id);
  const lines = data.items
    .map(
      (i) =>
        `<tr>
          <td style="${EMAIL_STYLES.tableCell}">${escapeHtml(i.product.name)}</td>
          <td style="${EMAIL_STYLES.tableCell};text-align:center">${i.quantity}</td>
          <td style="${EMAIL_STYLES.tableCell};text-align:right">${formatPriceCOP(Number(i.unitPrice))}</td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Confirmación de orden · Gold Legacy</title>
</head>
<body style="${EMAIL_STYLES.wrapper}">
  <div style="${EMAIL_STYLES.card}">
    <div style="${EMAIL_STYLES.cardInner}">
      <h1 style="${EMAIL_STYLES.logo}">Gold Legacy</h1>
      <p style="${EMAIL_STYLES.tagline}">Tradición familiar hecha joya</p>
      <hr style="${EMAIL_STYLES.goldLine}">
      <p style="${EMAIL_STYLES.heading}">Confirmación de pedido</p>
      <h2 style="${EMAIL_STYLES.title}">Gracias por tu compra</h2>
      <p style="${EMAIL_STYLES.body}">Hola <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p style="${EMAIL_STYLES.body}">Hemos recibido tu pedido correctamente. Aquí está el resumen de tu orden.</p>
      <div style="${EMAIL_STYLES.tableWrap}">
        <table style="width:100%;border-collapse:collapse" cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th style="${EMAIL_STYLES.tableHead}">Producto</th>
              <th style="${EMAIL_STYLES.tableHead};text-align:center;width:70px">Cant.</th>
              <th style="${EMAIL_STYLES.tableHead};text-align:right;width:100px">Precio</th>
            </tr>
          </thead>
          <tbody>${lines}</tbody>
          <tr>
            <td colspan="2" style="${EMAIL_STYLES.tableCell};${EMAIL_STYLES.totalRow}">Total</td>
            <td style="${EMAIL_STYLES.tableCell};${EMAIL_STYLES.totalRow};text-align:right">${formatPriceCOP(data.total)}</td>
          </tr>
        </table>
      </div>
      <p style="${EMAIL_STYLES.body};margin-bottom:4px"><strong style="color:#1a1814">Dirección de envío</strong></p>
      <p style="${EMAIL_STYLES.body};margin-top:0;color:#5c5854">${escapeHtml(data.shippingAddress)}, ${escapeHtml(data.shippingCity)}</p>
      <p style="font-size:12px;color:#8a8580;margin:0;font-family:'Segoe UI',system-ui,sans-serif">Orden ${orderNum} · ${dateStr}</p>
      <hr style="${EMAIL_STYLES.footerLine}">
      <p style="${EMAIL_STYLES.footerText}">Cualquier duda, responde a este correo.</p>
      <p style="${EMAIL_STYLES.footerBrand}">Gold Legacy</p>
    </div>
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

/**
 * Envía email con enlace para restablecer contraseña.
 * Si SMTP no está configurado o falla, no lanza error (solo registra en consola).
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP no configurado. No se envió correo de restablecimiento.");
    return;
  }

  const saludo = params.userName ? `Hola ${params.userName}` : "Hola";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Restablecer contraseña</title></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;background:#fafafa">
  <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 8px">Gold Legacy</h1>
    <p style="color:#666;font-size:14px;margin:0 0 24px">Restablecer contraseña</p>
    <p style="margin:0 0 16px">${saludo},</p>
    <p style="margin:0 0 16px">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente enlace (válido ${params.expiresInMinutes} minutos):</p>
    <p style="margin:16px 0"><a href="${params.resetUrl}" style="color:#B1891F;font-weight:600;text-decoration:underline">Restablecer contraseña</a></p>
    <p style="margin:16px 0 0;font-size:13px;color:#888">Si no solicitaste este cambio, ignora este correo. Tu contraseña no se modificará.</p>
    <p style="margin:24px 0 0;font-size:14px;color:#666">Gold Legacy</p>
  </div>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: params.to,
      subject: "Gold Legacy – Restablecer contraseña",
      html,
      text: `${saludo}. Para restablecer tu contraseña abre este enlace (válido ${params.expiresInMinutes} min): ${params.resetUrl}. Si no lo solicitaste, ignora este correo.`
    });
  } catch (err) {
    console.error("[email] Error al enviar correo de restablecimiento:", err);
  }
}

export type OrderShippedEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

/**
 * Envía email al cliente cuando la orden pasa a estado Enviado.
 * Incluye número de guía y enlace de seguimiento si se proporcionan.
 */
export async function sendOrderShippedEmail(data: OrderShippedEmailData): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP no configurado. No se envió aviso de envío.");
    return;
  }

  const orderNum = formatOrderNumber(data.orderId);
  const hasTracking = !!(data.trackingNumber?.trim() || data.trackingUrl?.trim());
  const trackingUrlEscaped = data.trackingUrl?.trim() ? escapeHtml(data.trackingUrl.trim()) : "";
  const trackingHtml = hasTracking
    ? `
    <div style="margin:24px 0;padding:20px;background:#faf8f5;border-left:3px solid #d4af37;border-radius:0 2px 2px 0">
      <p style="margin:0 0 10px 0;font-size:13px;letter-spacing:0.06em;color:#5c5854;text-transform:uppercase;font-family:'Segoe UI',system-ui,sans-serif">Seguimiento</p>
      ${data.trackingNumber?.trim() ? `<p style="margin:0 0 8px 0;font-size:15px;color:#1a1814;font-family:'Segoe UI',system-ui,sans-serif">Guía: <strong>${escapeHtml(data.trackingNumber.trim())}</strong></p>` : ""}
      ${trackingUrlEscaped ? `<p style="margin:0;font-size:14px"><a href="${trackingUrlEscaped}" style="${EMAIL_STYLES.link}">Rastrear envío →</a></p>` : ""}
    </div>
  `
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tu pedido fue enviado · Gold Legacy</title>
</head>
<body style="${EMAIL_STYLES.wrapper}">
  <div style="${EMAIL_STYLES.card}">
    <div style="${EMAIL_STYLES.cardInner}">
      <h1 style="${EMAIL_STYLES.logo}">Gold Legacy</h1>
      <p style="${EMAIL_STYLES.tagline}">Tradición familiar hecha joya</p>
      <hr style="${EMAIL_STYLES.goldLine}">
      <p style="${EMAIL_STYLES.heading}">Tu pedido está en camino</p>
      <h2 style="${EMAIL_STYLES.title}">Orden ${orderNum} enviada</h2>
      <p style="${EMAIL_STYLES.body}">Hola <strong>${escapeHtml(data.customerName)}</strong>,</p>
      <p style="${EMAIL_STYLES.body}">Tu pedido ha sido enviado y está en camino. ${hasTracking ? "Puedes hacer seguimiento con los datos a continuación." : "Te avisaremos cuando esté próximo a llegar."}</p>
      ${trackingHtml}
      <hr style="${EMAIL_STYLES.footerLine}">
      <p style="${EMAIL_STYLES.footerText}">Gracias por confiar en Gold Legacy.</p>
      <p style="${EMAIL_STYLES.footerBrand}">Gold Legacy</p>
    </div>
  </div>
</body>
</html>`;

  const subject = data.trackingNumber?.trim()
    ? `Gold Legacy – Tu pedido fue enviado (guía: ${data.trackingNumber.trim()})`
    : "Gold Legacy – Tu pedido fue enviado";
  const textParts = [
    `Hola ${data.customerName},`,
    `Tu orden ${formatOrderNumber(data.orderId)} fue enviada. Tu pedido va en camino.`
  ];
  if (data.trackingNumber?.trim()) textParts.push(`Número de guía: ${data.trackingNumber.trim()}`);
  if (data.trackingUrl?.trim()) textParts.push(`Rastrear envío: ${data.trackingUrl.trim()}`);
  textParts.push("Gracias por confiar en Gold Legacy.");

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: data.customerEmail,
      subject,
      html,
      text: textParts.join("\n\n")
    });
  } catch (err) {
    console.error("[email] Error al enviar aviso de envío:", err);
  }
}
