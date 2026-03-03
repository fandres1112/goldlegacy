import { NextResponse } from "next/server";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";
import { getMpPaymentsEnabled } from "@/lib/settings";

export async function GET() {
  const enabled = isMercadoPagoConfigured() && (await getMpPaymentsEnabled());
  return NextResponse.json({ enabled });
}

