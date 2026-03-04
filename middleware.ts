import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Proteger rutas /admin/*: solo permitir si hay token válido con role ADMIN
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("gl_token")?.value;
    if (!token) {
      const loginUrl = new URL("/iniciar-sesion", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!JWT_SECRET) {
      return NextResponse.next();
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
      const role = payload.role as string | undefined;
      if (role !== "ADMIN") {
        const loginUrl = new URL("/iniciar-sesion", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/iniciar-sesion", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
