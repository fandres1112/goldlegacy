import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIPOS_ES = ["Cadena", "Anillo", "Pulsera", "Arete", "Dije"];

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { name: true, slug: true },
    orderBy: { name: "asc" }
  });

  const workbook = new ExcelJS.Workbook();

  workbook.addWorksheet("Productos");
  const opcionesSheet = workbook.addWorksheet("Opciones");
  opcionesSheet.getCell("A1").value = "Tipo (columna tipo en Productos)";
  TIPOS_ES.forEach((t, i) => {
    opcionesSheet.getCell(`A${i + 2}`).value = t;
  });
  opcionesSheet.getCell("C1").value = "Categoría - slug (columna categoria en Productos)";
  categories.forEach((c, i) => {
    opcionesSheet.getCell(`C${i + 2}`).value = c.slug;
    opcionesSheet.getCell(`D${i + 2}`).value = c.name;
  });

  const lastCatRow = Math.max(2, categories.length + 1);
  const tipoRange = "Opciones!$A$2:$A$6";
  const categoriaRange = `Opciones!$C$2:$C$${lastCatRow}`;

  const productSheet = workbook.getWorksheet("Productos")!;
  const headers = [
    "nombre",
    "slug",
    "descripcion",
    "precio",
    "material",
    "tipo",
    "stock",
    "destacado",
    "categoria",
    "imagen1",
    "imagen2"
  ];
  const firstCategorySlug = categories[0]?.slug ?? "";
  const exampleRow = [
    "Cadena Oro 18K",
    "cadena-oro-18k",
    "Pieza en oro de 18 kilates.",
    760000,
    "Oro 18K",
    "Cadena",
    5,
    false,
    firstCategorySlug,
    "https://ejemplo.com/img1.jpg",
    "https://ejemplo.com/img2.jpg"
  ];

  productSheet.addRow(headers);
  productSheet.addRow(exampleRow);

  for (let row = 2; row <= 500; row++) {
    productSheet.getCell(`F${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [tipoRange]
    };
    productSheet.getCell(`I${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [categoriaRange]
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-productos-goldlegacy.xlsx"'
    }
  });
}
