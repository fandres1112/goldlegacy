import { NextResponse } from "next/server";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";

export async function GET() {
  return NextResponse.json({ enabled: isMercadoPagoConfigured() });
}
