import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const THEME = {
  navy: "FF0F1623",
  navyLight: "FF1A2332",
  gold: "FFD4AF37",
  goldLight: "FFF5E3B3",
  goldDark: "FFB1891F",
  white: "FFFFFFFF",
  cream: "FFFDFBF7",
  creamAlt: "FFFFFEFB",
  text: "FF1C1917",
  textMuted: "FF57534E",
  borderLight: "FFEBE8E4",
  borderHeader: "FF2A3548"
};

function addReportTitle(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  colCount: number
) {
  const dateStr = new Date().toLocaleDateString("es", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const row1 = sheet.getRow(1);
  row1.height = 28;
  const c1 = sheet.getCell(1, 1);
  c1.value = "GOLD LEGACY";
  c1.font = {
    name: "Georgia",
    size: 20,
    bold: true,
    color: { argb: THEME.gold }
  };
  sheet.mergeCells(1, 1, 1, colCount);

  const row2 = sheet.getRow(2);
  row2.height = 22;
  const c2 = sheet.getCell(2, 1);
  c2.value = title;
  c2.font = { name: "Georgia", size: 13, color: { argb: THEME.text } };
  sheet.mergeCells(2, 1, 2, colCount);

  const row3 = sheet.getRow(3);
  row3.height = 18;
  const c3 = sheet.getCell(3, 1);
  c3.value = subtitle;
  c3.font = { size: 10, color: { argb: THEME.textMuted } };
  sheet.mergeCells(3, 1, 3, colCount);

  const row4 = sheet.getRow(4);
  row4.height = 12;
  const c4 = sheet.getCell(4, 1);
  c4.border = { bottom: { style: "medium", color: { argb: THEME.gold } } };
  sheet.mergeCells(4, 1, 4, colCount);

  sheet.getRow(5).height = 8;
}

function applyTableHeader(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: THEME.navy }
  };
  cell.font = {
    bold: true,
    size: 10,
    color: { argb: THEME.white }
  };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  cell.border = {
    bottom: { style: "medium", color: { argb: THEME.borderHeader } },
    left: { style: "thin", color: { argb: THEME.borderHeader } },
    right: { style: "thin", color: { argb: THEME.borderHeader } }
  };
}

function applyTableHeaderRight(cell: ExcelJS.Cell) {
  applyTableHeader(cell);
  cell.alignment = { vertical: "middle", horizontal: "right", wrapText: true };
}

function applyTableHeaderCenter(cell: ExcelJS.Cell) {
  applyTableHeader(cell);
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

function applyDataCell(
  cell: ExcelJS.Cell,
  opts?: { alt?: boolean; alignRight?: boolean; alignCenter?: boolean }
) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: opts?.alt ? THEME.creamAlt : THEME.cream }
  };
  cell.font = { size: 10, color: { argb: THEME.text } };
  cell.border = {
    bottom: { style: "thin", color: { argb: THEME.borderLight } },
    left: { style: "thin", color: { argb: THEME.borderLight } },
    right: { style: "thin", color: { argb: THEME.borderLight } }
  };
  if (opts?.alignRight) cell.alignment = { horizontal: "right", vertical: "middle" };
  else if (opts?.alignCenter) cell.alignment = { horizontal: "center", vertical: "middle" };
  else cell.alignment = { horizontal: "left", vertical: "middle" };
}

function applyTotalRowStyle(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: THEME.navyLight }
  };
  cell.font = { bold: true, size: 10, color: { argb: THEME.goldLight } };
  cell.border = {
    top: { style: "double", color: { argb: THEME.gold } },
    bottom: { style: "thin", color: { argb: THEME.borderHeader } },
    left: { style: "thin", color: { argb: THEME.borderHeader } },
    right: { style: "thin", color: { argb: THEME.borderHeader } }
  };
  cell.alignment = { vertical: "middle" };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || undefined;
    const status = searchParams.get("status")?.trim() || undefined;

    const where: Record<string, unknown> = {};
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

    const orders = await prisma.order.findMany({
      where,
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
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Gold Legacy";
    workbook.created = new Date();

    const detalleHeaders = [
      "Fecha",
      "Hora",
      "ID Orden",
      "Cliente",
      "Email",
      "Teléfono",
      "Dirección",
      "Ciudad",
      "Estado",
      "Total orden (COP)",
      "Producto",
      "Cantidad",
      "Precio unit. (COP)",
      "Subtotal (COP)"
    ];
    const resumenHeaders = [
      "ID Orden",
      "Fecha",
      "Hora",
      "Cliente",
      "Email",
      "Teléfono",
      "Dirección",
      "Ciudad",
      "Estado",
      "Total (COP)",
      "Nº ítems"
    ];

    const detalleColWidths = [12, 8, 26, 20, 26, 14, 28, 14, 12, 15, 30, 9, 15, 14];
    const resumenColWidths = [26, 11, 8, 20, 26, 14, 28, 14, 12, 14, 9];

    const headerAlignRightDetalle = [10, 12, 13, 14];
    const headerAlignCenterDetalle = [9];
    const headerAlignRightResumen = [10];
    const headerAlignCenterResumen = [9, 11];

    // —— Hoja Detalle ——
    const sheetDetalle = workbook.addWorksheet("Detalle ítems", {
      views: [{ state: "frozen", ySplit: 6 }]
    });

    addReportTitle(
      sheetDetalle,
      "Detalle de ítems por orden",
      `Reporte generado el ${new Date().toLocaleDateString("es", { dateStyle: "long" })}`,
      detalleHeaders.length
    );

    const dataStartDetalle = 6;
    sheetDetalle.addRow(detalleHeaders);
    const headerRowDetalle = sheetDetalle.getRow(dataStartDetalle);
    headerRowDetalle.height = 22;
    detalleHeaders.forEach((_, i) => {
      const cell = sheetDetalle.getCell(dataStartDetalle, i + 1);
      if (headerAlignRightDetalle.includes(i + 1)) applyTableHeaderRight(cell);
      else if (headerAlignCenterDetalle.includes(i + 1)) applyTableHeaderCenter(cell);
      else applyTableHeader(cell);
    });

    let rowDetalle = dataStartDetalle + 1;
    for (const order of orders) {
      for (const item of order.items) {
        const r = sheetDetalle.getRow(rowDetalle);
        r.height = 20;
        r.getCell(1).value = new Date(order.createdAt).toLocaleDateString("es", { dateStyle: "short" });
        r.getCell(2).value = new Date(order.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
        r.getCell(3).value = order.id;
        r.getCell(4).value = order.customerName;
        r.getCell(5).value = order.customerEmail ?? "";
        r.getCell(6).value = order.customerPhone ?? "";
        r.getCell(7).value = order.shippingAddress;
        r.getCell(8).value = order.shippingCity;
        r.getCell(9).value = order.status;
        r.getCell(10).value = Number(order.total);
        r.getCell(11).value = item.product.name;
        r.getCell(12).value = item.quantity;
        r.getCell(13).value = Number(item.unitPrice);
        r.getCell(14).value = Number(item.unitPrice) * item.quantity;

        const isAlt = (rowDetalle - (dataStartDetalle + 1)) % 2 === 1;
        for (let c = 1; c <= 14; c++) {
          applyDataCell(r.getCell(c), {
            alt: isAlt,
            alignRight: headerAlignRightDetalle.includes(c),
            alignCenter: headerAlignCenterDetalle.includes(c)
          });
        }
        r.getCell(10).numFmt = "#,##0";
        r.getCell(13).numFmt = "#,##0";
        r.getCell(14).numFmt = "#,##0";
        rowDetalle++;
      }
    }
    detalleColWidths.forEach((w, i) => {
      sheetDetalle.getColumn(i + 1).width = w;
    });

    // —— Hoja Resumen ——
    const sheetResumen = workbook.addWorksheet("Resumen órdenes", {
      views: [{ state: "frozen", ySplit: 6 }]
    });

    addReportTitle(
      sheetResumen,
      "Resumen de órdenes",
      `Reporte generado el ${new Date().toLocaleDateString("es", { dateStyle: "long" })}`,
      resumenHeaders.length
    );

    const dataStartResumen = 6;
    sheetResumen.addRow(resumenHeaders);
    const headerRowResumen = sheetResumen.getRow(dataStartResumen);
    headerRowResumen.height = 22;
    resumenHeaders.forEach((_, i) => {
      const cell = sheetResumen.getCell(dataStartResumen, i + 1);
      if (headerAlignRightResumen.includes(i + 1)) applyTableHeaderRight(cell);
      else if (headerAlignCenterResumen.includes(i + 1)) applyTableHeaderCenter(cell);
      else applyTableHeader(cell);
    });

    let rowResumen = dataStartResumen + 1;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    orders.forEach((order, idx) => {
      const r = sheetResumen.getRow(rowResumen);
      r.height = 20;
      r.getCell(1).value = order.id;
      r.getCell(2).value = new Date(order.createdAt).toLocaleDateString("es", { dateStyle: "short" });
      r.getCell(3).value = new Date(order.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
      r.getCell(4).value = order.customerName;
      r.getCell(5).value = order.customerEmail ?? "";
      r.getCell(6).value = order.customerPhone ?? "";
      r.getCell(7).value = order.shippingAddress;
      r.getCell(8).value = order.shippingCity;
      r.getCell(9).value = order.status;
      r.getCell(10).value = Number(order.total);
      r.getCell(11).value = order.items.reduce((sum, i) => sum + i.quantity, 0);

      const isAlt = idx % 2 === 1;
      for (let c = 1; c <= 11; c++) {
        applyDataCell(r.getCell(c), {
          alt: isAlt,
          alignRight: headerAlignRightResumen.includes(c),
          alignCenter: headerAlignCenterResumen.includes(c)
        });
      }
      r.getCell(10).numFmt = "#,##0";
      rowResumen++;
    });

    const totalRow = sheetResumen.getRow(rowResumen);
    totalRow.height = 24;
    totalRow.getCell(1).value = "Total";
    sheetResumen.mergeCells(rowResumen, 1, rowResumen, 9);
    for (let c = 1; c <= 11; c++) {
      applyTotalRowStyle(totalRow.getCell(c));
    }
    totalRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    totalRow.getCell(10).value = totalRevenue;
    totalRow.getCell(10).numFmt = "#,##0";
    totalRow.getCell(10).alignment = { horizontal: "right", vertical: "middle" };
    totalRow.getCell(11).value = orders.length;
    totalRow.getCell(11).alignment = { horizontal: "center", vertical: "middle" };

    resumenColWidths.forEach((w, i) => {
      sheetResumen.getColumn(i + 1).width = w;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `ordenes-goldlegacy-${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
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
