import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/siteUrl";
import { z } from "zod";
import crypto from "crypto";

const bodySchema = z.object({
  email: z.string().email("Email inválido").transform((s) => s.trim().toLowerCase())
});

const TOKEN_EXPIRY_MINUTES = 60;

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
    const { email } = bodySchema.parse(json);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Siempre devolver 200 para no revelar si el email existe
    if (!user) {
      return NextResponse.json({ message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt }
    });

    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/restablecer-contrasena?token=${token}`;

    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetUrl,
      expiresInMinutes: TOKEN_EXPIRY_MINUTES
    });

    return NextResponse.json({ message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud" },
      { status: 500 }
    );
  }
}
