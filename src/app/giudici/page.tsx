export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import GiudiciDashboard from "@/app/giudici/GiudiciDashboard";

export default async function GiudiciPage() {
  const [athletes, disciplines] = await Promise.all([
    prisma.athlete.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.discipline.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        kind: true,
        name: true,
        teamSize: true,
        coefficient: true,
        targetMin: true,
        targetMax: true,
        targetFixed: true,
        targetOverride: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-4" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <Link className="text-sm text-zinc-500 hover:text-zinc-700" href="/">
          ← Home
        </Link>
        <Link className="text-sm text-zinc-500 hover:text-zinc-700" href="/classifica">
          Classifica
        </Link>
      </div>

      <GiudiciDashboard athletes={athletes} disciplines={disciplines} />
    </div>
  );
}
