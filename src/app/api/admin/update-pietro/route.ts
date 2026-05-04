import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const password = "D4v1d3F10r3!";
    const username = "pietro";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.upsert({
      where: { username },
      update: { password: hashedPassword },
      create: {
        username,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ ok: true, message: `Password aggiornata per ${admin.username}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
