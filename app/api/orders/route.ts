import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive()
});

const orderCreateSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(5),
  shippingCity: z.string().min(2),
  items: z.array(orderItemSchema).min(1)
});

export async function POST(req: NextRequest) {
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
          data: {
            stock: product.stock - item.quantity
          }
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos de orden inválidos", issues: error.issues },
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

  const where: any = {};

  if (!isAdmin) {
    where.userId = user.id;
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
}

