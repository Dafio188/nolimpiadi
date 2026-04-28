export const dynamic = "force-dynamic";

import PrintButton from "./PrintButton";
import { prisma } from "@/lib/prisma";
// Tipo locale per evitare import di Prisma nel client/turbopack
type DisciplineKind = "AIR_HOCKEY" | "PING_PONG" | "FRECCETTE" | "CALCIO_BALILLA";

import Link from "next/link";

type QualRow = {
  athlete_id: string;
  name: string;
  qualification_weighted: string | number;
  matches_played: number;
};

type Athlete = { id: string; name: string; letter: string | null };

interface QualificationSlot {
  kind: DisciplineKind;
  side1Letters: string[];
  side2Letters: string[];
}

interface QualificationTurn {
  id: string;
  index: number;
  scheduledAt: Date | null;
  slots: QualificationSlot[];
}

function kindLabel(kind: DisciplineKind) {
  switch (kind) {
    case "CALCIO_BALILLA":
      return "Calcio-balilla";
    case "FRECCETTE":
      return "Freccette";
    case "PING_PONG":
      return "Ping-pong";
    case "AIR_HOCKEY":
      return "Air Hockey";
    default:
      return kind;
  }

}

function joinTeam(names: string[]) {
  return names.filter(Boolean).join(" + ");
}

function asSeedLabel(seedIndex: number, seeds: QualRow[], fallback: string) {
  const row = seeds[seedIndex];
  if (!row) return fallback;
  return `${seedIndex + 1}) ${row.name}`;
}

function BracketBox({ title, a, b }: { title: string; a: string; b: string }) {
  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-3 shadow-sm break-inside-avoid">
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1 mb-2">{title}</div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 rounded border border-zinc-200 px-3 py-2 text-sm font-medium bg-zinc-50/50">{a}</div>
          <div className="w-16 h-10 border-2 border-zinc-400 rounded flex items-center justify-center font-bold text-lg italic text-zinc-300">PTS</div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 rounded border border-zinc-200 px-3 py-2 text-sm font-medium bg-zinc-50/50">{b}</div>
          <div className="w-16 h-10 border-2 border-zinc-400 rounded flex items-center justify-center font-bold text-lg italic text-zinc-300">PTS</div>
        </div>
      </div>
    </div>
  );
}

function BracketTemplate({ kind, seeds }: { kind: DisciplineKind; seeds: QualRow[] }) {
  const limit = kind === "CALCIO_BALILLA" ? 5 : 6;

  if (limit === 6) {
    const s1 = asSeedLabel(0, seeds, "1) —");
    const s2 = asSeedLabel(1, seeds, "2) —");
    const s3 = asSeedLabel(2, seeds, "3) —");
    const s4 = asSeedLabel(3, seeds, "4) —");
    const s5 = asSeedLabel(4, seeds, "5) —");
    const s6 = asSeedLabel(5, seeds, "6) —");
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4">
          <BracketBox title="Quarti (3 vs 6)" a={s3} b={s6} />
          <BracketBox title="Quarti (4 vs 5)" a={s4} b={s5} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <BracketBox title="Semifinale 1" a={s1} b="Vincente (4 vs 5)" />
          <BracketBox title="Semifinale 2" a={s2} b="Vincente (3 vs 6)" />
        </div>
        <div className="max-w-sm mx-auto w-full">
          <BracketBox title="Finale" a="Vincente SF1" b="Vincente SF2" />
        </div>
      </div>
    );
  }

  const s1 = asSeedLabel(0, seeds, "1) —");
  const s2 = asSeedLabel(1, seeds, "2) —");
  const s3 = asSeedLabel(2, seeds, "3) —");
  const s4 = asSeedLabel(3, seeds, "4) —");
  const s5 = asSeedLabel(4, seeds, "5) —");

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-sm mx-auto w-full">
        <BracketBox title="Play-in (4 vs 5)" a={s4} b={s5} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <BracketBox title="Semifinale 1" a={s1} b="Vincente play-in" />
        <BracketBox title="Semifinale 2" a={s2} b={s3} />
      </div>
      <div className="max-w-sm mx-auto w-full">
        <BracketBox title="Finale" a="Vincente SF1" b="Vincente SF2" />
      </div>
    </div>
  );
}

async function qualificati(kind: DisciplineKind) {
  const limit = kind === "CALCIO_BALILLA" ? 5 : 6;

  const rows = await prisma.$queryRaw<QualRow[]>`
    SELECT
      q.athlete_id,
      a.name,
      q.qualification_weighted,
      q.matches_played
    FROM classifica_qualificazione_disciplina q
    INNER JOIN athletes a ON a.id = q.athlete_id
    WHERE q.kind::text = ${kind}
    ORDER BY q.qualification_weighted DESC, q.matches_played DESC, a.name ASC
    LIMIT ${limit}
  `;
  return rows;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default async function StampaPage() {
  const kinds: DisciplineKind[] = [
    "AIR_HOCKEY",
    "PING_PONG",
    "FRECCETTE",
    "CALCIO_BALILLA",
  ];


  const [settings, turns, athletes, phase2] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { id: 1 } }),
    prisma.qualificationTurn.findMany({
      orderBy: { index: "asc" },
      include: { slots: { orderBy: { kind: "asc" } } },
    }),
    prisma.athlete.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, letter: true } as any }),
    Promise.all(kinds.map(async (kind) => ({ kind, seeds: await qualificati(kind) }))),
  ]);

  const letterToName = new Map<string, string>((athletes as any[]).filter(a => a.letter).map(a => [a.letter!, a.name]));

  const durationMinutes = settings?.turnDurationMinutes ?? 10;

  const turnChunks = chunkArray(turns, 4);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8">
      {/* HEADER WEB-ONLY */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">MODULO DI GARA CARTACEO</h1>
          <p className="mt-2 text-zinc-600">
            Pagine ottimizzate per la stampa. Ogni foglio contiene 4 serie per una facile compilazione manuale.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PrintButton />
          <Link className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-sm font-bold transition-colors" href="/admin">
            ← Pannello Admin
          </Link>
        </div>
      </div>

      {/* FASE 1 - QUALIFICAZIONI (DIVISA IN PAGINE) */}
      {turnChunks.length === 0 ? (
        <div className="print:hidden p-10 text-center rounded-3xl border-2 border-dashed border-zinc-200 text-zinc-500 font-medium">
          Nessuna serie pianificata. Vai in Setup per generare il calendario.
        </div>
      ) : (
        (turnChunks as any[]).map((chunk: any[], chunkIdx: number) => (

          <section key={chunkIdx} className="print:page-break-after print:m-0 print:p-0 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2">
              <h2 className="text-xl font-black uppercase tracking-tighter">
                NOLImpiadi 2026 <span className="text-zinc-400">/</span> FASE 1 <span className="text-zinc-400">/</span> PAGINA {chunkIdx + 1}
              </h2>
              <div className="text-sm font-bold px-3 py-1 bg-zinc-900 text-white rounded-full">
                SERIE {chunk[0].index} - {chunk[chunk.length - 1].index}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {chunk.map((turn: QualificationTurn) => {

                const start = turn.scheduledAt ? new Date(turn.scheduledAt) : null;
                const timeStr = start ? start.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' }) : "--:--";

                return (
                  <div key={turn.id} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                      <span className="font-black text-lg">SERIE {turn.index}</span>
                      <span className="text-sm font-mono font-bold text-zinc-500 italic">Ore {timeStr}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {kinds.map((kind: DisciplineKind) => {
                        const slot = (turn.slots as any[]).find(s => s.kind === kind);

                        const a = slot?.side1Letters?.map((l: string) => letterToName.get(l) || `Atleta ${l}`) || [];
                        const b = slot?.side2Letters?.map((l: string) => letterToName.get(l) || `Atleta ${l}`) || [];

                        return (
                          <div key={kind} className="border border-zinc-300 rounded-xl overflow-hidden shadow-sm break-inside-avoid bg-white">
                            <div className="bg-zinc-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
                              {kindLabel(kind)}
                            </div>
                            <div className="p-2 grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                              {/* Lato A */}
                              <div className="flex flex-col gap-1">
                                <div className="text-sm font-bold leading-tight truncate">{joinTeam(a)}</div>
                                <div className="w-full h-8 border border-zinc-300 rounded-md bg-white flex items-center justify-center text-[10px] text-zinc-300 font-bold italic">PUNTI</div>
                              </div>
                              
                              <div className="text-[10px] font-black text-zinc-300">VS</div>

                              {/* Lato B */}
                              <div className="flex flex-col gap-1 items-end">
                                <div className="text-sm font-bold leading-tight truncate text-right">{joinTeam(b)}</div>
                                <div className="w-full h-8 border border-zinc-300 rounded-md bg-white flex items-center justify-center text-[10px] text-zinc-300 font-bold italic">PUNTI</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SPAZIO NOTE A FINE PAGINA */}
            <div className="mt-auto pt-6 border-t border-zinc-200">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Note / Firma Giudice</div>
              <div className="h-10 border border-zinc-200 rounded-xl bg-zinc-50/30"></div>
            </div>
          </section>
        ))
      )}

      {/* FASE 2 - TABELLONI (UNA PAGINA PER DISCIPLINA) */}
      <div className="print:page-break-before mt-10 space-y-20">
        {phase2.map(({ kind, seeds }: { kind: DisciplineKind, seeds: QualRow[] }, idx: number) => (

          <section key={kind} className="print:page-break-after flex flex-col gap-8 min-h-[900px]">
            <div className="flex items-center justify-between border-b-4 border-zinc-900 pb-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter">
                FASE 2 <span className="text-zinc-400">/</span> {kindLabel(kind)}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-zinc-900 rounded-full"></div>
                <div className="text-sm font-black uppercase">Tabellone Ufficiale</div>
              </div>
            </div>

            <div className="grid grid-cols-[250px,1fr] gap-10">
              {/* SEEDING LIST */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-zinc-100 p-2 rounded">Ranking Qualificati</h3>
                <div className="border-2 border-zinc-900 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900 text-white text-xs uppercase tracking-widest font-black">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Atleta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {Array.from({ length: kind === "CALCIO_BALILLA" ? 5 : 6 }).map((_, i: number) => (

                        <tr key={i} className="bg-white">
                          <td className="px-3 py-3 font-black text-zinc-400 border-r border-zinc-100">{i + 1}</td>
                          <td className="px-3 py-3 font-bold">{seeds[i]?.name || "________________"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed italic">
                  Note: In caso di parità nel tabellone, vince chi ha ottenuto la migliore efficienza media nella Fase 1.
                </div>
              </div>

              {/* BRACKET */}
              <div className="bg-zinc-50/50 rounded-3xl border border-zinc-200 p-8 shadow-inner">
                <BracketTemplate kind={kind} seeds={seeds} />
              </div>
            </div>
          </section>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print-hidden { display: none !important; }
          .break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
          .print\\:page-break-after { page-break-after: always !important; }
          .print\\:page-break-before { page-break-before: always !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:p-0 { padding: 0 !important; }
          section { min-height: auto; display: block; }
          @page { size: portrait; margin: 1.5cm; }
        }
      `}} />
    </div>
  );
}
