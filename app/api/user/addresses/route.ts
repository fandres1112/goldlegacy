import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookie } from "@/lib/auth";
import { z } from "zod";

const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(2).transform((s) => s.trim()),
  email: z.string().email().transform((s) => s.trim()),
  phone: z.string().optional().transform((s) => (s && s.trim()) || undefined),
  shippingAddress: z.string().min(5).transform((s) => s.trim()),
  shippingCity: z.string().min(2).transform((s) => s.trim())
});

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const addresses = await prisma.userAddress.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items: addresses });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const data = createAddressSchema.parse(json);

    const address = await prisma.userAddress.create({
      data: {
        userId: user.id,
        label: data.label ?? undefined,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity
      }
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al guardar la dirección" },
      { status: 500 }
    );
  }
}
