import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getMpPaymentsEnabled, setMpPaymentsEnabled } from "@/lib/settings";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const enabled = await getMpPaymentsEnabled();
  return NextResponse.json({ enabled });
}

const bodySchema = z.object({
  enabled: z.boolean()
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { enabled } = bodySchema.parse(json);
    await setMpPaymentsEnabled(enabled);
    return NextResponse.json({ enabled });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo actualizar la configuración" },
      { status: 500 }
    );
  }
}

