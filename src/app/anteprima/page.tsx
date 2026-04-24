export const dynamic = "force-dynamic";

import Link from "next/link";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

function ScoreRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="text-sm font-medium text-zinc-900">{label}</div>
      <div className="text-sm text-zinc-700">{value}</div>
    </div>
  );
}

function DisciplineCard({
  title,
  badge,
  left,
  right,
  target,
}: {
  title: string;
  badge: string;
  left: string;
  right: string;
  target: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-xs text-zinc-600">{badge}</div>
        </div>
        <Pill>Da giocare</Pill>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-sm font-medium text-zinc-900">{left}</div>
          <div className="mt-2 h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
            Punti…
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-sm font-medium text-zinc-900">{right}</div>
          <div className="mt-2 h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
            Punti…
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-zinc-700">
          Target vittoria: <span className="font-medium text-zinc-900">{target}</span>
        </div>
        <button
          type="button"
          className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Inserisci risultato
        </button>
      </div>
    </div>
  );
}

function BracketBox({ title, a, b }: { title: string; a: string; b: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</div>
      <div className="mt-3 grid gap-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900">
          {a}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900">
          {b}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">Punti…</div>
        <div className="h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">Punti…</div>
      </div>
    </div>
  );
}

export default function AnteprimaPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Anteprima grafica (bozza)</h1>
            <div className="mt-1 text-sm text-zinc-600">
              Stile A “Olimpiadi da Bar” in versione tutta chiara. Serve solo per valutare mood e gerarchie.
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link className="text-zinc-600 hover:text-zinc-900" href="/">
              Home
            </Link>
            <Link className="text-zinc-600 hover:text-zinc-900" href="/classifica">
              Classifica
            </Link>
            <Link className="text-zinc-600 hover:text-zinc-900" href="/gare">
              Gare
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Fase 1</div>
              <div className="mt-1 text-xl font-semibold">Tabellone segna-punti (turno corrente)</div>
              <div className="mt-1 text-sm text-zinc-600">
                Il giudice inserisce i risultati delle 4 gare del turno. Quando 4/4 sono inserite si passa al turno
                successivo già determinato.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>Turno 3</Pill>
              <Pill>Inizio 20:40</Pill>
              <Pill>Fine 20:50</Pill>
              <Pill>Mancano 06:12</Pill>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ScoreRow label="A riposo" value="Emma (25), Gianni (50)" />
            <ScoreRow label="Regola" value="Calcio-balilla a 5" />
            <ScoreRow label="Note" value="Atleti amici: fair play" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <DisciplineCard
              title="Air Hockey"
              badge="Singolo · peso 8"
              left="Pietro (100)"
              right="Matheus (25)"
              target="4"
            />
            <DisciplineCard
              title="Ping-pong"
              badge="Singolo · peso 13"
              left="Claudia (75)"
              right="Stefano (25)"
              target="11"
            />
            <DisciplineCard
              title="Freccette"
              badge="Singolo · peso 1"
              left="Gustavo (100)"
              right="Alessandro (75)"
              target="220"
            />
            <DisciplineCard
              title="Calcio-balilla"
              badge="Doppio · peso 21"
              left="Valentino (100) + Alberto (50)"
              right="Massimo (75) + Gianluca (50)"
              target="5"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Fase 2</div>
              <div className="mt-1 text-xl font-semibold">Tabellone eliminazione (bozza percorso)</div>
              <div className="mt-1 text-sm text-zinc-600">
                Una pagina per disciplina. Qui esempio “Ping-pong (top 6)”. Si può stampare anche senza nomi usando i
                seed.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>Disciplina: Ping-pong</Pill>
              <Pill>Qualificati: 6</Pill>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Seed (esempio)</div>
                <div className="mt-3 grid gap-2">
                  <ScoreRow label="1" value="Pietro" />
                  <ScoreRow label="2" value="Gustavo" />
                  <ScoreRow label="3" value="Claudia" />
                  <ScoreRow label="4" value="Massimo" />
                  <ScoreRow label="5" value="Alberto" />
                  <ScoreRow label="6" value="Emma" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-3 lg:grid-cols-3">
              <div className="grid gap-4">
                <BracketBox title="Quarti (3 vs 6)" a="3) Claudia" b="6) Emma" />
                <BracketBox title="Quarti (4 vs 5)" a="4) Massimo" b="5) Alberto" />
              </div>
              <div className="grid gap-4">
                <BracketBox title="Semifinale 1" a="1) Pietro" b="Vincente (4 vs 5)" />
                <BracketBox title="Semifinale 2" a="2) Gustavo" b="Vincente (3 vs 6)" />
              </div>
              <div className="grid gap-4">
                <BracketBox title="Finale" a="Vincente SF1" b="Vincente SF2" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

