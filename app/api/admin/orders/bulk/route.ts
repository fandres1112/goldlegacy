import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/auditLog";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const bulkUpdateSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, "Selecciona al menos una orden"),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const)
});

export async function PATCH(req: NextRequest) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { orderIds, status } = bulkUpdateSchema.parse(json);

    const result = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: status as OrderStatus }
    });

    await createAuditLog({
      action: "ORDER_STATUS_UPDATE",
      userId: admin.id,
      entity: "order",
      entityId: null,
      details: { bulk: true, orderIds, status, updatedCount: result.count }
    });

    return NextResponse.json({
      updated: result.count,
      message: `Se actualizaron ${result.count} orden(es) a ${status}.`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo actualizar las órdenes" },
      { status: 500 }
    );
  }
}
