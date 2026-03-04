import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";
import { sendOrderShippedEmail } from "@/lib/email";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const),
  trackingNumber: z.string().max(200).optional().nullable(),
  trackingUrl: z.string().url().max(500).optional().nullable()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "ID de orden requerido" },
      { status: 400 }
    );
  }

  try {
    const json = await req.json();
    const parsed = updateOrderSchema.parse(json);
    const { status, trackingNumber, trackingUrl } = parsed;

    const previous = await prisma.order.findUnique({
      where: { id },
      select: { status: true }
    });
    if (!previous) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const updateData: { status: OrderStatus; trackingNumber?: string | null; trackingUrl?: string | null } = {
      status: status as OrderStatus
    };
    if (status === "SHIPPED") {
      if (parsed.trackingNumber !== undefined) updateData.trackingNumber = parsed.trackingNumber || null;
      if (parsed.trackingUrl !== undefined) updateData.trackingUrl = parsed.trackingUrl || null;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData
    });

    await createAuditLog({
      action: "ORDER_STATUS_UPDATE",
      userId: admin.id,
      entity: "order",
      entityId: order.id,
      details: { orderId: order.id, status: order.status, trackingNumber: order.trackingNumber ?? undefined }
    });

    const isNewlyShipped = status === "SHIPPED" && previous.status !== "SHIPPED";
    if (isNewlyShipped) {
      await sendOrderShippedEmail({
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Orden no encontrada o no se pudo actualizar" },
      { status: 404 }
    );
  }
}
