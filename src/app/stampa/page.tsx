export const dynamic = "force-dynamic";

import PrintButton from "./PrintButton";
import { prisma } from "@/lib/prisma";
import { DisciplineKind } from "@/generated/prisma/client";
import Link from "next/link";

type QualRow = {
  athlete_id: string;
  name: string;
  qualification_weighted: string | number;
  matches_played: number;
};

type Athlete = { id: string; name: string };

function kindLabel(kind: DisciplineKind) {
  switch (kind) {
    case DisciplineKind.CALCIO_BALILLA:
      return "Calcio-balilla";
    case DisciplineKind.FRECCETTE:
      return "Freccette";
    case DisciplineKind.PING_PONG:
      return "Ping-pong";
    case DisciplineKind.AIR_HOCKEY:
      return "Air Hockey";
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
    <div className="rounded-lg border border-zinc-900/25 bg-white p-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{title}</div>
      <div className="mt-1 grid gap-1 text-sm">
        <div className="rounded border border-zinc-200 px-2 py-1">{a}</div>
        <div className="rounded border border-zinc-200 px-2 py-1">{b}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-600">
        <div className="rounded border border-zinc-200 px-2 py-1">Punti</div>
        <div className="rounded border border-zinc-200 px-2 py-1">Punti</div>
      </div>
    </div>
  );
}

function BracketTemplate({ kind, seeds }: { kind: DisciplineKind; seeds: QualRow[] }) {
  const limit = kind === DisciplineKind.CALCIO_BALILLA ? 5 : 6;
  if (limit === 6) {
    const s1 = asSeedLabel(0, seeds, "1) —");
    const s2 = asSeedLabel(1, seeds, "2) —");
    const s3 = asSeedLabel(2, seeds, "3) —");
    const s4 = asSeedLabel(3, seeds, "4) —");
    const s5 = asSeedLabel(4, seeds, "5) —");
    const s6 = asSeedLabel(5, seeds, "6) —");
    return (
      <div className="grid gap-4 print-bracket-grid">
        <div className="grid gap-4">
          <BracketBox title="Quarti (3 vs 6)" a={s3} b={s6} />
          <BracketBox title="Quarti (4 vs 5)" a={s4} b={s5} />
        </div>
        <div className="grid gap-4">
          <BracketBox title="Semifinale 1" a={s1} b="Vincente (4 vs 5)" />
          <BracketBox title="Semifinale 2" a={s2} b="Vincente (3 vs 6)" />
        </div>
        <div className="grid gap-4">
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
    <div className="grid gap-4 print-bracket-grid">
      <div className="grid gap-4">
        <BracketBox title="Play-in (4 vs 5)" a={s4} b={s5} />
      </div>
      <div className="grid gap-4">
        <BracketBox title="Semifinale 1" a={s1} b="Vincente play-in" />
        <BracketBox title="Semifinale 2" a={s2} b={s3} />
      </div>
      <div className="grid gap-4">
        <BracketBox title="Finale" a="Vincente SF1" b="Vincente SF2" />
      </div>
    </div>
  );
}

async function qualificati(kind: DisciplineKind) {
  const limit = kind === DisciplineKind.CALCIO_BALILLA ? 5 : 6;
  const rows = await prisma.$queryRaw<QualRow[]>`
    SELECT
      q.athlete_id,
      a.name,
      q.qualification_weighted,
      q.matches_played
    FROM classifica_qualificazione_disciplina q
    INNER JOIN athletes a ON a.id = q.athlete_id
    WHERE q.kind = ${kind}
    ORDER BY q.qualification_weighted DESC, q.matches_played DESC, a.name ASC
    LIMIT ${limit}
  `;
  return rows;
}

export default async function StampaPage() {
  const kinds = [
    DisciplineKind.AIR_HOCKEY,
    DisciplineKind.PING_PONG,
    DisciplineKind.FRECCETTE,
    DisciplineKind.CALCIO_BALILLA,
  ];

  const [settings, turns, athletes, phase2] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { id: 1 } }),
    prisma.qualificationTurn.findMany({
      orderBy: { index: "asc" },
      include: { slots: { orderBy: { kind: "asc" } } },
    }),
    prisma.athlete.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    Promise.all(kinds.map(async (kind) => ({ kind, seeds: await qualificati(kind) }))),
  ]);

  const athleteById = new Map<string, Athlete>(athletes.map((a) => [a.id, a]));
  const durationMinutes = settings?.turnDurationMinutes ?? 10;

  const turnHeaders = turns.map((t) => {
    const start = t.scheduledAt ? new Date(t.scheduledAt) : null;
    const end = start ? new Date(start.getTime() + durationMinutes * 60_000) : null;
    return { index: t.index, start, end };
  });

  const slotByTurnKind = new Map<string, { side1: string[]; side2: string[] }>();
  for (const t of turns) {
    for (const s of t.slots) {
      slotByTurnKind.set(`${t.index}:${s.kind}`, { side1: s.side1AthleteIds, side2: s.side2AthleteIds });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stampa tabelloni</h1>
          <div className="mt-1 text-sm text-zinc-600">
            Consigliato: stampa in orizzontale per la Fase 1. La Fase 2 è in più pagine (una per disciplina).
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PrintButton />
          <Link className="text-sm text-zinc-600 hover:text-zinc-900" href="/">
            Home
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 print-no-border">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-base font-semibold">Fase 1 · Programmazione serie</div>
            <div className="mt-1 text-sm text-zinc-600">
              Gare in verticale · Serie in orizzontale · Durata serie: {durationMinutes} min
            </div>
          </div>
          <div className="text-sm text-zinc-600">
            Serie pianificate: <span className="font-medium text-zinc-900">{turns.length}</span>
          </div>
        </div>

        {turns.length === 0 ? (
          <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
            Nessun turno pianificato. Genera la Fase 1 da Setup → “Fase 1 (Qualificazioni)”.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto print-no-scroll">
            <table className="min-w-[900px] w-full border-collapse text-left text-sm print-table">
              <thead className="bg-zinc-50 print-header">
                <tr>
                  <th className="w-40 border border-zinc-200 px-2 py-2 text-xs uppercase tracking-wide text-zinc-500">
                    Gara
                  </th>
                  {turnHeaders.map((t) => (
                    <th key={t.index} className="border border-zinc-200 px-2 py-2 align-bottom">
                      <div className="text-sm font-semibold">
                        Serie {t.index}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-600">
                        {t.start ? t.start.toLocaleTimeString() : "—"}
                        {t.end ? `–${t.end.toLocaleTimeString()}` : ""}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kinds.map((kind) => (
                  <tr key={kind}>
                    <td className="border border-zinc-200 px-2 py-2 font-medium">{kindLabel(kind)}</td>
                    {turnHeaders.map((t) => {
                      const slot = slotByTurnKind.get(`${t.index}:${kind}`);
                      const a = slot?.side1.map((id) => athleteById.get(id)?.name ?? "—") ?? [];
                      const b = slot?.side2.map((id) => athleteById.get(id)?.name ?? "—") ?? [];
                      return (
                        <td key={t.index} className="border border-zinc-200 px-2 py-2 align-top">
                          <div className="text-sm">
                            {a.length > 0 || b.length > 0 ? (
                              <>
                                <div className="font-medium">{joinTeam(a) || "—"}</div>
                                <div className="text-xs text-zinc-600">vs</div>
                                <div className="font-medium">{joinTeam(b) || "—"}</div>
                              </>
                            ) : (
                              <div className="text-zinc-500">—</div>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                            <div className="rounded border border-zinc-200 px-2 py-1">Punti</div>
                            <div className="rounded border border-zinc-200 px-2 py-1">Punti</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {phase2.map(({ kind, seeds }, idx) => (
        <section
          key={kind}
          className={`rounded-2xl border border-zinc-200 bg-white p-4 print-no-border ${idx === 0 ? "" : "print-page-break"}`}
        >
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-base font-semibold">Fase 2 · Tabellone {kindLabel(kind)}</div>
              <div className="mt-1 text-sm text-zinc-600">
                Modello stampabile con percorso (quarti/semifinali/finale) e spazio risultati.
              </div>
            </div>
            <div className="text-sm text-zinc-600">
              Qualificati: <span className="font-medium text-zinc-900">{seeds.length}</span> /{" "}
              <span className="font-medium text-zinc-900">{kind === DisciplineKind.CALCIO_BALILLA ? 5 : 6}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 print-phase2-grid">
            <div className="rounded-xl border border-zinc-200 p-3 print-no-border">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Qualificati (seed)</div>
              <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Atleta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: kind === DisciplineKind.CALCIO_BALILLA ? 5 : 6 }).map((_, i) => {
                      const r = seeds[i];
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/40"}>
                          <td className="px-3 py-2 font-medium">{i + 1}</td>
                          <td className="px-3 py-2">{r ? r.name : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-zinc-600">
                Se vuoi stampare “senza nomi”, lascia questi campi vuoti e compila a penna.
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3 print-no-border">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tabellone</div>
              <div className="mt-3">
                <BracketTemplate kind={kind} seeds={seeds} />
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
