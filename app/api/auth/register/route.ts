import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const registerSchema = z.object({
  email: z.string().email("Email inválido").transform((s) => s.trim().toLowerCase()),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().max(120).optional().transform((s) => (s && s.trim()) || undefined)
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email, password, name } = registerSchema.parse(json);

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        role: UserRole.USER
      }
    });

    const token = signJwt({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    response.cookies.set("gl_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return response;
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
