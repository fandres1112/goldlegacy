import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const address = await prisma.userAddress.findFirst({
    where: { id, userId: user.id }
  });

  if (!address) {
    return NextResponse.json(
      { error: "Dirección no encontrada" },
      { status: 404 }
    );
  }

  await prisma.userAddress.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
