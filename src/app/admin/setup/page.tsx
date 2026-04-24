export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SetupClient from "@/app/admin/setup/setup-client";

export default async function SetupPage() {
  const [athletes, disciplines] = await Promise.all([
    prisma.athlete.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, categoryScore: true } }),
    prisma.discipline.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, kind: true, targetFixed: true } }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Setup</h1>
        <Link className="text-sm text-zinc-600 hover:text-zinc-900" href="/">
          Home
        </Link>
      </div>

      <SetupClient athletes={athletes} disciplines={disciplines} />
    </div>
  );
}
