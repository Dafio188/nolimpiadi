import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const username = (formData.get("username") as string) || "admin";
    const password = formData.get("password") as string;

    if (!password) {
      return NextResponse.redirect(new URL("/login?error=credenziali", req.url));
    }

    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin) {
      return NextResponse.redirect(new URL("/login?error=credenziali", req.url));
    }

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return NextResponse.redirect(new URL("/login?error=credenziali", req.url));
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    // Reindirizzamento relativo per evitare blocchi CORS
    return NextResponse.redirect(new URL("/admin", req.url));
  } catch (e) {
    return NextResponse.redirect(new URL("/login?error=errore", req.url));
  }
}