import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento e intenta de nuevo." },
      { status: 429, headers: limit.retryAfter ? { "Retry-After": String(limit.retryAfter) } : undefined }
    );
  }

  try {
    const json = await req.json();
    const { token, password } = bodySchema.parse(json);

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "El enlace ha expirado o no es válido. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.delete({ where: { id: record.id } })
    ]);

    return NextResponse.json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo restablecer la contraseña" },
      { status: 500 }
    );
  }
}
