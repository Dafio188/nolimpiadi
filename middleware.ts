import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminPaths = ["/admin/setup", "/admin/finali", "/stampa"];
  const isAdminPath = adminPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isAdminPath) {
    const session = request.cookies.get("admin_session");

    if (!session || session.value !== "authenticated") {
      if (request.nextUrl.pathname === "/login") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/setup/:path*", "/admin/finali/:path*", "/stampa/:path*"],
};