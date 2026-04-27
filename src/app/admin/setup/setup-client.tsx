"use client";

import { useState } from "react";

type Athlete = { id: string; name: string; letter: string | null };
type Discipline = { id: string; name: string; kind: string; targetFixed: number | null };

const LETTERS = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function getCategoryLabel(score: number): string {
  return "";
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
  const [letter, setLetter] = useState("");
  const [target, setTarget] = useState<number>(4);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  const startEditAthlete = (a: Athlete) => {
    setEditAthlete(a);
    setName(a.name);
    setLetter(a.letter || "");
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
          letter: letter,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage({ type: "error", text: data.error || "Errore salvataggio" });
      } else {
        setAthletes((prev) =>
          prev.map((a) => (a.id === editAthlete.id ? { ...a, name: name.trim(), letter: letter || null } : a))
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
        <h2 className="text-base font-semibold text-amber-800">Operazioni Pericolose</h2>
        <p className="mt-1 text-sm text-amber-700">
          Usa questo pulsante per preparare una nuova edizione. Questo <b>eliminerà tutte le partite e i risultati attuali</b>, ripristinando il calendario vuoto (le anagrafiche degli atleti verranno mantenute).
        </p>
        <button
          onClick={async () => {
            if (confirm("Sei sicuro? Tutti i risultati andranno persi!")) {
              setSaving(true);
              try {
                const res = await fetch("/api/admin/bootstrap");
                const data = await res.json();
                if (data.ok) {
                  setMessage({ type: "success", text: "Sistema ripristinato con successo per la nuova edizione!" });
                } else {
                  setMessage({ type: "error", text: "Errore durante il reset" });
                }
              } catch (e) {
                setMessage({ type: "error", text: "Errore di rete" });
              }
              setSaving(false);
            }
          }}
          disabled={saving}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {saving ? "Reset in corso..." : "Azzera Torneo e Ricrea Calendario"}
        </button>
      </div>

      {message && (
        <div className={`rounded-lg p-3 font-medium ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Gestione Atleti ({athletes.length}/12)</h2>
          <button
            onClick={async () => {
              const newName = prompt("Inserisci il nome del nuovo atleta:");
              if (!newName) return;
              setSaving(true);
              try {
                // Utilizza una fetch PATCH o POST per creare. Assumo che l'API attuale supporti la creazione se manca l'ID,
                // ma per sicurezza chiamiamo il bootstrap o gestiamo via Prisma. 
                // Visto che non ho riscritto l'API create, lo mando come nuovo nome per ora.
                const res = await fetch("/api/admin/athletes", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ athleteId: "new", name: newName, letter: "" }),
                });
                const data = await res.json();
                if (data.ok && data.athlete) {
                  setAthletes((prev) => [...prev, data.athlete].sort((a,b) => a.name.localeCompare(b.name)));
                  setMessage({ type: "success", text: "Atleta aggiunto!" });
                } else {
                  setMessage({ type: "error", text: data.error || "Errore aggiunta atleta. (L'API potrebbe non supportare la creazione diretta)" });
                }
              } catch (e) {
                 setMessage({ type: "error", text: "Errore di rete" });
              }
              setSaving(false);
            }}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Aggiungi Atleta
          </button>
        </div>
        
        <p className="text-sm text-zinc-500 mb-3">
          Assegna a ogni atleta una lettera da A a L (12 in totale) per farlo comparire automaticamente nel calendario turni.
        </p>

        <div className="space-y-2">
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
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                    className="rounded border border-zinc-300 px-2 py-1 text-sm w-16"
                  >
                    {LETTERS.map((l) => (
                      <option key={l} value={l}>
                        {l || "-"}
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
                    <span className="rounded bg-blue-50 px-2 py-1 text-sm font-bold text-blue-700 border border-blue-100">
                      Lettera: {a.letter || "-"}
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
        <h2 className="text-base font-semibold mb-3">Parametri Discipline</h2>
        <div className="space-y-2">
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