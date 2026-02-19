import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * Mercado Pago envía POST con body: { type, data: { id } }.
 * Solo procesamos type === "payment". Obtenemos el pago por ID y, si está approved,
 * actualizamos la orden a PAID, descontamos stock y enviamos email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body?.type as string | undefined;
    const paymentId = body?.data?.id ?? body?.id;

    if (type !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    const payment = await getPayment(String(paymentId));
    if (!payment || payment.status !== "approved" || !payment.externalReference) {
      return NextResponse.json({ ok: true });
    }

    const orderId = payment.externalReference;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } }
      }
    });

    if (!order || order.status === "PAID") {
      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    });

    await sendOrderConfirmationEmail({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        product: { name: i.product.name },
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice)
      }))
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[mercadopago webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
