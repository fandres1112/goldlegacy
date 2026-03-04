import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cities?q=...&limit=25
 * Busca ciudades de Colombia por nombre. Sin q devuelve las primeras por nombre.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = Math.min(Number(searchParams.get("limit")) || 25, 50);

  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : {};

  const cities = await prisma.city.findMany({
    where,
    take: limit,
    orderBy: [{ name: "asc" }],
    select: {
      name: true,
      department: { select: { name: true } }
    }
  });

  const items = cities.map((c) => ({
    name: c.name,
    departmentName: c.department.name
  }));

  return NextResponse.json({ items });
}
