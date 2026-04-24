"use client";

import { useState } from "react";

type Athlete = { id: string; name: string; categoryScore: number };
type Discipline = { id: string; name: string; kind: string; targetFixed: number | null };

const CATEGORIES = [
  { value: 100, label: "A (100)" },
  { value: 75, label: "B (75)" },
  { value: 50, label: "C (50)" },
  { value: 25, label: "D (25)" },
] as const;

function getCategoryLabel(score: number): string {
  if (score === 100) return "A";
  if (score === 75) return "B";
  if (score === 50) return "C";
  return "D";
}

export default function SetupClient({
  athletes: initialAthletes,
  disciplines: initialDisciplines,
}: {
  athletes: Athlete[];
  disciplines: Discipline[];
}) {
  const [athletes, setAthletes] = useState(initialAthletes);
  const [disciplines, setDisciplines] = useState(initialDisciplines);
  const [editAthlete, setEditAthlete] = useState<Athlete | null>(null);
  const [editDiscipline, setEditDiscipline] = useState<Discipline | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(100);
  const [target, setTarget] = useState<number>(4);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  const startEditAthlete = (a: Athlete) => {
    setEditAthlete(a);
    setName(a.name);
    setCategory(a.categoryScore);
    setMessage(null);
  };

  const startEditDiscipline = (d: Discipline) => {
    setEditDiscipline(d);
    setTarget(d.targetFixed ?? 4);
    setMessage(null);
  };

  const cancelAthlete = () => {
    setEditAthlete(null);
    setMessage(null);
  };

  const cancelDiscipline = () => {
    setEditDiscipline(null);
    setMessage(null);
  };

  const saveAthlete = async () => {
    if (!editAthlete) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/athletes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: editAthlete.id,
          name: name.trim(),
          categoryScore: category,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage({ type: "error", text: data.error || "Errore salvataggio" });
      } else {
        setAthletes((prev) =>
          prev.map((a) => (a.id === editAthlete.id ? { ...a, name: name.trim(), categoryScore: category } : a))
        );
        setEditAthlete(null);
        setMessage({ type: "success", text: "Salvataggio effettuato!" });
      }
    } catch {
      setMessage({ type: "error", text: "Errore di rete" });
    }
    setSaving(false);
  };

  const saveDiscipline = async () => {
    if (!editDiscipline) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/discipline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineKind: editDiscipline.kind,
          targetFixed: target,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage({ type: "error", text: data.error || "Errore salvataggio" });
      } else {
        setDisciplines((prev) =>
          prev.map((d) => (d.kind === editDiscipline.kind ? { ...d, targetFixed: target } : d))
        );
        setEditDiscipline(null);
        setMessage({ type: "success", text: "Salvataggio effettuato!" });
      }
    } catch {
      setMessage({ type: "error", text: "Errore di rete" });
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-base font-semibold">Strumenti Admin</h2>
        <p className="mt-1 text-sm text-amber-800">
          Per generare il calendario o resettare il sistema, usa la pagina dedicata:
        </p>
        <a
          href="/admin-tools.html"
          className="mt-2 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Apri Strumenti Admin →
        </a>
      </div>

      {message && (
        <div className={`rounded-lg p-3 ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-base font-semibold">Atleti ({athletes.length})</h2>
        <div className="mt-3 space-y-2">
          {athletes.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
              {editAthlete?.id === a.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(Number(e.target.value))}
                    className="rounded border border-zinc-300 px-2 py-1 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={saveAthlete}
                    disabled={saving}
                    className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "..." : "Salva"}
                  </button>
                  <button
                    onClick={cancelAthlete}
                    disabled={saving}
                    className="rounded bg-zinc-400 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-500 disabled:opacity-50"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-600">
                      {getCategoryLabel(a.categoryScore)} ({a.categoryScore})
                    </span>
                    <button
                      type="button"
                      onClick={() => startEditAthlete(a)}
                      className="rounded bg-zinc-600 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700"
                    >
                      Modifica
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-base font-semibold">Discipline ({disciplines.length})</h2>
        <div className="mt-3 space-y-2">
          {disciplines.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
              {editDiscipline?.kind === d.kind ? (
                <div className="flex flex-1 items-center gap-2">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-sm text-zinc-500">Target:</span>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value) || 1)}
                    className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={saveDiscipline}
                    disabled={saving}
                    className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "..." : "Salva"}
                  </button>
                  <button
                    onClick={cancelDiscipline}
                    disabled={saving}
                    className="rounded bg-zinc-400 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-500 disabled:opacity-50"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{d.name}</span>
                    <span className="rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700">
                      Target: {d.targetFixed}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditDiscipline(d)}
                    className="rounded bg-zinc-600 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Modifica
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}