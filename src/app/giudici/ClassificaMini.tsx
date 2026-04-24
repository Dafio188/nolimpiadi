"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  athlete_id: string;
  name: string;
  total_weighted: string | number;
};

function formatNumber(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toFixed(2);
}

export default function ClassificaMini() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch("/api/classifica", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; rows?: Row[]; error?: string };
        if (!res.ok || !data.ok || !data.rows) throw new Error(data.error ?? "Errore caricamento classifica");
        if (cancelled) return;
        setRows(
          data.rows.map((r) => ({
            athlete_id: r.athlete_id,
            name: r.name,
            total_weighted: r.total_weighted,
          })),
        );
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
      }
    }

    void tick();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const leader = useMemo(() => rows[0] ?? null, [rows]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Classifica live</div>
          <div className="mt-1 text-base font-semibold">{leader ? leader.name : "—"}</div>
        </div>
        <div className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">{rows.length || 12} atleti</div>
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-zinc-200">
        <div className="grid grid-cols-[56px_1fr_88px] gap-0 bg-zinc-50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          <div>Pos</div>
          <div>Atleta</div>
          <div className="text-right">Punti</div>
        </div>
        <div className="divide-y divide-zinc-200">
          {rows.map((r, idx) => (
            <div key={r.athlete_id} className="grid grid-cols-[56px_1fr_88px] items-center px-3 py-2 text-sm">
              <div className="text-zinc-600">{idx + 1}</div>
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
              </div>
              <div className="text-right font-mono text-[13px]">{formatNumber(r.total_weighted)}</div>
            </div>
          ))}
          {rows.length === 0 ? <div className="px-3 py-6 text-sm text-zinc-600">Nessun dato.</div> : null}
        </div>
      </div>
    </div>
  );
}
