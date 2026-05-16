import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const disciplines = await prisma.discipline.findMany();
  const systemSettings = await prisma.systemSetting.findFirst();
  return NextResponse.json({ disciplines, systemSettings });
}
