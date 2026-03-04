import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkOrderRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "productId requerido"),
  quantity: z.coerce.number().int().positive("cantidad debe ser al menos 1")
});

const orderCreateSchema = z.object({
  customerName: z.string().min(2, "Nombre de al menos 2 caracteres").transform((s) => s.trim()),
  customerEmail: z.string().email("Email inválido").transform((s) => s.trim()),
  customerPhone: z.string().optional().transform((s) => (s && s.trim()) || undefined),
  shippingAddress: z.string().min(5, "Dirección de al menos 5 caracteres").transform((s) => s.trim()),
  shippingCity: z.string().min(2, "Ciudad de al menos 2 caracteres").transform((s) => s.trim()),
  items: z.array(orderItemSchema).min(1, "Agrega al menos un producto al carrito")
});

export async function POST(req: NextRequest) {
  const limit = checkOrderRateLimit(req);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." },
      { status: 429, headers: limit.retryAfter ? { "Retry-After": String(limit.retryAfter) } : undefined }
    );
  }

  try {
    const json = await req.json();
    const { customerName, customerEmail, customerPhone, shippingAddress, shippingCity, items } =
      orderCreateSchema.parse(json);

    const user = await getUserFromCookie();

    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: {
            in: items.map((i) => i.productId)
          }
        }
      });

      if (products.length !== items.length) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      let total = 0;

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        if (product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
        total += Number(product.price) * item.quantity;
      }

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity }
        });
      }

      const order = await tx.order.create({
        data: {
          total,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingCity,
          userId: user?.id ?? null,
          items: {
            create: items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price
              };
            })
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return order;
    });

    await sendOrderConfirmationEmail({
      id: result.id,
      customerName: result.customerName,
      customerEmail: result.customerEmail,
      total: Number(result.total),
      shippingAddress: result.shippingAddress,
      shippingCity: result.shippingCity,
      createdAt: result.createdAt,
      items: result.items.map((i) => ({
        product: { name: i.product.name },
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice)
      }))
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      const message = first?.message ?? "Datos de orden inválidos";
      return NextResponse.json(
        { error: message, issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Uno o más productos no existen" },
          { status: 400 }
        );
      }
      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          { error: "No hay stock suficiente para algún producto" },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: "Error al crear la orden" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");
    const q = searchParams.get("q")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;

    const where: Record<string, unknown> = {};

    if (!isAdmin) {
      where.userId = user.id;
    }

    if (status && ["PENDING", "PAID", "SHIPPED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    if (q && q.length >= 1) {
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
        { shippingCity: { contains: q, mode: "insensitive" } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("[api/orders GET]", error);
    const message = error instanceof Error ? error.message : "Error al cargar órdenes";
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: "Error al cargar órdenes", detail: isDev ? message : undefined },
      { status: 500 }
    );
  }
}

