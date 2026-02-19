/**
 * Integración con Mercado Pago (Checkout Pro).
 * Crear preferencia y consultar pago vía API REST.
 */

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_API = "https://api.mercadopago.com";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(MP_ACCESS_TOKEN);
}

export type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
};

export type CreatePreferenceParams = {
  orderId: string;
  items: PreferenceItem[];
  payerEmail: string;
  backUrls: {
    success: string;
    pending: string;
    failure: string;
  };
};

/**
 * Crea una preferencia de pago en Mercado Pago y devuelve init_point (URL de pago).
 */
export async function createPreference(params: CreatePreferenceParams): Promise<{ init_point: string } | null> {
  if (!MP_ACCESS_TOKEN) return null;

  const body = {
    items: params.items.map((item) => ({
      title: item.title.substring(0, 256),
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: item.currency_id
    })),
    payer: { email: params.payerEmail },
    external_reference: params.orderId,
    back_urls: params.backUrls,
    auto_return: "approved" as const,
    notification_url: `${getBaseUrl()}/api/payments/mercadopago/webhook`
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[mercadopago] Error creating preference:", res.status, err);
    return null;
  }

  const data = (await res.json()) as { init_point?: string };
  return data.init_point ? { init_point: data.init_point } : null;
}

export type PaymentStatus = "approved" | "pending" | "rejected" | "cancelled" | "refunded" | "charged_back" | null;

type PaymentResponse = {
  id: number;
  status?: string;
  external_reference?: string | null;
};

/**
 * Obtiene el estado de un pago por ID (para webhook).
 */
export async function getPayment(paymentId: string): Promise<{ status: PaymentStatus; externalReference: string | null } | null> {
  if (!MP_ACCESS_TOKEN) return null;

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
  });

  if (!res.ok) return null;

  const data = (await res.json()) as PaymentResponse;
  const status = (data.status as PaymentStatus) ?? null;
  const externalReference = data.external_reference ?? null;
  return { status, externalReference };
}

export { getBaseUrl };
