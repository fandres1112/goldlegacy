import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=google_denied", req.url)
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=google_not_configured", req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=invalid_callback", req.url)
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("gl_google_state")?.value;
  cookieStore.delete("gl_google_state");

  if (!savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=invalid_state", req.url)
    );
  }

  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Google token error:", err);
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=google_token", req.url)
    );
  }

  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token;

  const userInfoRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!userInfoRes.ok) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=google_userinfo", req.url)
    );
  }

  const googleUser = await userInfoRes.json();
  const email = (googleUser.email as string)?.trim().toLowerCase();
  const name = (googleUser.name as string)?.trim() || null;

  if (!email) {
    return NextResponse.redirect(
      new URL("/iniciar-sesion?error=no_email", req.url)
    );
  }

  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      10
    );
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: UserRole.USER
      }
    });
  } else if (name && !user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name }
    });
  }

  const token = signJwt({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  const response = NextResponse.redirect(
    new URL(user.role === "ADMIN" ? "/admin" : "/", req.url)
  );

  response.cookies.set("gl_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
