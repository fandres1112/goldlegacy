import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    const dateStr = new Date().toISOString().slice(0, 10);

    // Hoja 1: Detalle (una fila por ítem de cada orden)
    const detalleRows: Array<Record<string, unknown>> = []
    for (const order of orders) {
      for (const item of order.items) {
        detalleRows.push({
          "Fecha": new Date(order.createdAt).toLocaleDateString("es", { dateStyle: "short" }),
          "Hora": new Date(order.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
          "ID Orden": order.id,
          "Cliente": order.customerName,
          "Email": order.customerEmail ?? "",
          "Teléfono": order.customerPhone ?? "",
          "Dirección": order.shippingAddress,
          "Ciudad": order.shippingCity,
          "Estado": order.status,
          "Total orden (COP)": Number(order.total),
          "Producto": item.product.name,
          "Cantidad": item.quantity,
          "Precio unit. (COP)": Number(item.unitPrice),
          "Subtotal (COP)": Number(item.unitPrice) * item.quantity
        })
      }
    }

    const sheetDetalle = XLSX.utils.json_to_sheet(detalleRows.length ? detalleRows : [{ "Fecha": "", "ID Orden": "", "Cliente": "", "Producto": "", "Cantidad": "", "Total orden (COP)": "" }]);

    // Hoja 2: Resumen (una fila por orden)
    const resumenRows = orders.map((order) => ({
      "ID Orden": order.id,
      "Fecha": new Date(order.createdAt).toLocaleDateString("es", { dateStyle: "short" }),
      "Hora": new Date(order.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      "Cliente": order.customerName,
      "Email": order.customerEmail ?? "",
      "Teléfono": order.customerPhone ?? "",
      "Dirección": order.shippingAddress,
      "Ciudad": order.shippingCity,
      "Estado": order.status,
      "Total (COP)": Number(order.total),
      "Nº ítems": order.items.reduce((sum, i) => sum + i.quantity, 0)
    }));

    const sheetResumen = XLSX.utils.json_to_sheet(resumenRows.length ? resumenRows : [{ "ID Orden": "", "Fecha": "", "Cliente": "", "Total (COP)": "" }]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheetDetalle, "Detalle ítems");
    XLSX.utils.book_append_sheet(workbook, sheetResumen, "Resumen órdenes");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const filename = `ordenes-goldlegacy-${dateStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}
