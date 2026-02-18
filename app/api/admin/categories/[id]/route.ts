import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  try {
    const body = await _req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    if (parsed.data.slug != null) {
      const existing = await prisma.category.findFirst({
        where: { slug: parsed.data.slug, id: { not: id } }
      });
      if (existing) {
        return NextResponse.json({ error: "Ya existe otra categoría con ese slug" }, { status: 400 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.slug != null && { slug: parsed.data.slug }),
        ...(parsed.data.isActive != null && { isActive: parsed.data.isActive })
      }
    });

    await createAuditLog({
      action: "CATEGORY_UPDATE",
      userId: admin.id,
      entity: "category",
      entityId: category.id,
      details: { name: category.name, slug: category.slug }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}
