import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getWhatsappNumber, setWhatsappNumber } from "@/lib/settings";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const number = await getWhatsappNumber();
  return NextResponse.json({ number });
}

const bodySchema = z.object({
  number: z.string().max(20).transform((s) => s.trim())
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { number } = bodySchema.parse(json);
    await setWhatsappNumber(number);
    return NextResponse.json({ number: number || null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo actualizar el número" },
      { status: 500 }
    );
  }
}
