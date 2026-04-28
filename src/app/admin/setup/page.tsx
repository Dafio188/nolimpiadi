export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";
import SetupClient from "@/app/admin/setup/setup-client";

export default async function SetupPage() {
  const [athletes, disciplines] = await Promise.all([
    prisma.athlete.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, letter: true } }),
    prisma.discipline.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, kind: true, targetFixed: true } }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-4xl font-black text-[#1d1d1f] flex items-center gap-4">
          <Settings className="w-10 h-10 text-purple-500" />
          CONFIGURAZIONE
        </h1>
        <p className="text-[#86868b] font-medium">Gestione atleti e ripristino per nuovo anno.</p>
      </div>

      <SetupClient athletes={athletes} disciplines={disciplines} />
    </div>
  );
}
