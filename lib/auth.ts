import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // No lanzamos error aquí para no romper en build sin .env,
  // pero las rutas que lo usen validarán y fallarán de forma controlada.
  console.warn("JWT_SECRET no está definido. Configúralo en tu .env");
}

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signJwt(payload: JwtPayload, expiresIn: string = "7d") {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no configurado");
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string): JwtPayload | null {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getUserFromCookie() {
  const store = cookies();
  const token = store.get("gl_token")?.value;
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub }
  });

  return user;
}

export async function requireAdmin() {
  const user = await getUserFromCookie();
  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

