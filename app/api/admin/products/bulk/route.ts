import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ProductType } from "@prisma/client";

const VALID_TYPES = new Set<string>(["CHAIN", "RING", "BRACELET", "EARRING", "PENDANT"]);

const TIPO_ES_TO_EN: Record<string, string> = {
  cadena: "CHAIN",
  anillo: "RING",
  pulsera: "BRACELET",
  arete: "EARRING",
  aretes: "EARRING",
  dije: "PENDANT",
  dijes: "PENDANT"
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getStr(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v == null) return "";
  return String(v).trim();
}

function getNum(row: Record<string, unknown>, key: string): number | null {
  const v = row[key];
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let file: File;
  try {
    const formData = await req.formData();
    const f = formData.get("file");
    if (!f || !(f instanceof File)) {
      return NextResponse.json(
        { error: "Envía un archivo Excel (.xlsx). Campo: file" },
        { status: 400 }
      );
    }
    file = f;
  } catch {
    return NextResponse.json(
      { error: "Error al leer el archivo" },
      { status: 400 }
    );
  }

  const name = (file.name || "").toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return NextResponse.json(
      { error: "Solo se aceptan archivos Excel (.xlsx o .xls)." },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, unknown>[];

  try {
    const workbook = XLSX.read(buf, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo leer el archivo Excel. Verifica que sea .xlsx o .xls y que la primera fila tenga los encabezados." },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "El archivo no tiene filas de datos (solo encabezados o vacío)." },
      { status: 400 }
    );
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c.id]));
  const existingSlugs = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug)
  );

  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>;
    const rowNum = i + 2;

    const nameVal = getStr(row, "name") || getStr(row, "nombre");
    if (!nameVal || nameVal.length < 2) {
      errors.push({ row: rowNum, message: "Nombre vacío o muy corto" });
      continue;
    }

    let slugVal = getStr(row, "slug") || slugify(nameVal);
    if (!slugVal) slugVal = slugify(nameVal) || `producto-${i + 1}`;
    if (existingSlugs.has(slugVal)) {
      let suffix = 1;
      while (existingSlugs.has(`${slugVal}-${suffix}`)) suffix++;
      slugVal = `${slugVal}-${suffix}`;
    }
    existingSlugs.add(slugVal);

    const description = getStr(row, "description") || getStr(row, "descripcion");
    if (!description || description.length < 10) {
      errors.push({ row: rowNum, message: "Descripción vacía o muy corta (mín. 10 caracteres)" });
      continue;
    }

    const price = getNum(row, "price") ?? getNum(row, "precio");
    if (price == null || price <= 0) {
      errors.push({ row: rowNum, message: "Precio inválido o faltante" });
      continue;
    }

    const material = getStr(row, "material");
    if (!material || material.length < 2) {
      errors.push({ row: rowNum, message: "Material vacío o muy corto" });
      continue;
    }

    const tipoRaw = getStr(row, "type") || getStr(row, "tipo");
    const typeVal = VALID_TYPES.has(tipoRaw.toUpperCase())
      ? tipoRaw.toUpperCase()
      : (TIPO_ES_TO_EN[tipoRaw.toLowerCase()] ?? "");
    if (!VALID_TYPES.has(typeVal)) {
      errors.push({
        row: rowNum,
        message: `Tipo inválido. Usa: Cadena, Anillo, Pulsera, Arete, Dije (o CHAIN, RING, etc.)`
      });
      continue;
    }

    const stock = getNum(row, "stock");
    const stockInt = stock != null && Number.isInteger(stock) && stock >= 0 ? stock : 0;

    const featVal = getStr(row, "isFeatured") || getStr(row, "destacado") || "";
    const isFeatured =
      featVal === "1" || featVal === "true" || featVal === "si" || featVal === "sí" || featVal === "yes";

    const categorySlug = getStr(row, "categorySlug") || getStr(row, "categoria") || getStr(row, "categoría");
    const categoryId = categorySlug ? categoryBySlug.get(categorySlug.toLowerCase()) ?? null : null;

    const image1 = getStr(row, "image1") || getStr(row, "imagen1");
    const image2 = getStr(row, "image2") || getStr(row, "imagen2");
    const images: string[] = [];
    if (image1 && (image1.startsWith("http://") || image1.startsWith("https://"))) images.push(image1);
    if (image2 && (image2.startsWith("http://") || image2.startsWith("https://"))) images.push(image2);
    if (images.length === 0) {
      errors.push({ row: rowNum, message: "Al menos una imagen (image1) con URL válida" });
      continue;
    }

    try {
      await prisma.product.create({
        data: {
          name: nameVal,
          slug: slugVal,
          description,
          price,
          material,
          type: typeVal as ProductType,
          images,
          stock: stockInt,
          isFeatured,
          categoryId
        }
      });
      created++;
    } catch (e) {
      errors.push({
        row: rowNum,
        message: e instanceof Error ? e.message : "Error al crear el producto"
      });
    }
  }

  return NextResponse.json({ created, total: rows.length, errors });
}
