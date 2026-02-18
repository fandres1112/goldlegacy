import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const)
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
    const { status } = updateOrderSchema.parse(json);

    const order = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus }
    });

    await createAuditLog({
      action: "ORDER_STATUS_UPDATE",
      userId: admin.id,
      entity: "order",
      entityId: order.id,
      details: { orderId: order.id, status: order.status }
    });

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
