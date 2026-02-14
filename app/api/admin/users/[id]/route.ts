import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  name: z.string().max(120).optional().transform((s) => (s && s.trim()) || undefined)
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  try {
    const json = await req.json();
    const data = updateUserSchema.parse(json);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Indica al menos un campo a actualizar (role o name)" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (data.role === "USER" && existing.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede quitar el último administrador" },
          { status: 400 }
        );
      }
    }

    const updateData: { role?: UserRole; name?: string | null } = {};
    if (data.role !== undefined) updateData.role = data.role as UserRole;
    if (data.name !== undefined) updateData.name = data.name ?? null;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Error al actualizar el usuario" },
      { status: 500 }
    );
  }
}
