import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ProductType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";

const productUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  material: z.string().min(2).optional(),
  type: z.nativeEnum(ProductType).optional(),
  images: z.array(z.string().url()).min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().optional()
});

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(_req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true
    }
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const json = await req.json();
    const data = productUpdateSchema.parse(json);

    const existing = await prisma.product.findUnique({
      where: { slug: params.slug }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data
    });

    await createAuditLog({
      action: "PRODUCT_UPDATE",
      userId: admin.id,
      entity: "product",
      entityId: existing.id,
      details: { slug: params.slug, name: updated.name }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de actualización inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();

    const existing = await prisma.product.findUnique({
      where: { slug: params.slug }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: existing.id }
    });

    await createAuditLog({
      action: "PRODUCT_DELETE",
      userId: admin.id,
      entity: "product",
      entityId: existing.id,
      details: { name: existing.name, slug: existing.slug }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}

