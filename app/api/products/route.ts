import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";

const productCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  material: z.string().min(2),
  type: z.nativeEnum(ProductType),
  images: z.array(z.string().url()).min(1),
  stock: z.number().int().nonnegative(),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().optional()
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "12");
  const idsParam = searchParams.get("ids");
  const type = searchParams.get("type");
  const material = searchParams.get("material");
  const categorySlug = searchParams.get("category");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const featured = searchParams.get("featured");

  const where: any = {};

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      where.id = { in: ids };
    }
  }

  if (type && type in ProductType) {
    where.type = type;
  }

  if (material) {
    where.material = {
      contains: material,
      mode: "insensitive"
    };
  }

  if (featured === "true") {
    where.isFeatured = true;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.price.lte = parseFloat(maxPrice);
    }
  }

  if (categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: categorySlug, isActive: true }
    });
    if (category) {
      where.categoryId = category.id;
    } else {
      return NextResponse.json(
        { items: [], total: 0, page, pageSize },
        { status: 200 }
      );
    }
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true
      }
    }),
    prisma.product.count({ where })
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize
  });
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const json = await req.json();
    const data = productCreateSchema.parse(json);

    const product = await prisma.product.create({
      data
    });

    await createAuditLog({
      action: "PRODUCT_CREATE",
      userId: admin.id,
      entity: "product",
      entityId: product.id,
      details: { name: product.name, slug: product.slug }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de producto inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}

