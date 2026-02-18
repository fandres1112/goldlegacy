import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().min(1, "Slug requerido").regex(/^[a-z0-9-]+$/, "Slug: solo minúsculas, números y guiones"),
  isActive: z.boolean().optional().default(true)
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ items: categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al listar categorías" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({
      where: { slug: parsed.data.slug }
    });
    if (existing) {
      return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        isActive: parsed.data.isActive ?? true
      }
    });

    await createAuditLog({
      action: "CATEGORY_CREATE",
      userId: admin.id,
      entity: "category",
      entityId: category.id,
      details: { name: category.name, slug: category.slug }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
