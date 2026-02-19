import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { createPreference, getBaseUrl, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "productId requerido"),
  quantity: z.coerce.number().int().positive("cantidad debe ser al menos 1")
});

const orderCreateSchema = z.object({
  customerName: z.string().min(2).transform((s) => s.trim()),
  customerEmail: z.string().email().transform((s) => s.trim()),
  customerPhone: z.string().optional().transform((s) => (s && s.trim()) || undefined),
  shippingAddress: z.string().min(5).transform((s) => s.trim()),
  shippingCity: z.string().min(2).transform((s) => s.trim()),
  items: z.array(orderItemSchema).min(1, "Agrega al menos un producto")
});

/**
 * Crea una orden en estado PENDING (sin descontar stock) y una preferencia de Mercado Pago.
 * Devuelve init_point para redirigir al usuario al checkout de MP.
 */
export async function POST(req: NextRequest) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json(
      { error: "Pagos con Mercado Pago no están configurados" },
      { status: 503 }
    );
  }

  try {
    const json = await req.json();
    const { customerName, customerEmail, customerPhone, shippingAddress, shippingCity, items } =
      orderCreateSchema.parse(json);

    const user = await getUserFromCookie();

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } }
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

      return tx.order.create({
        data: {
          total,
          status: "PENDING",
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
          items: { include: { product: true } }
        }
      });
    });

    const base = getBaseUrl();
    const preference = await createPreference({
      orderId: order.id,
      payerEmail: order.customerEmail,
      items: order.items.map((i) => ({
        title: i.product.name,
        quantity: i.quantity,
        unit_price: Number(i.unitPrice),
        currency_id: "COP"
      })),
      backUrls: {
        success: `${base}/checkout/exito?order_id=${order.id}`,
        pending: `${base}/checkout/pendiente?order_id=${order.id}`,
        failure: `${base}/checkout/error?order_id=${order.id}`
      }
    });

    if (!preference?.init_point) {
      return NextResponse.json(
        { error: "No se pudo crear la sesión de pago. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      init_point: preference.init_point
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json({ error: "Uno o más productos no existen" }, { status: 400 });
      }
      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json({ error: "No hay stock suficiente" }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Error al preparar el pago" },
      { status: 500 }
    );
  }
}
