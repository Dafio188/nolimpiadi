"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      className="print-hidden h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
      onClick={() => window.print()}
    >
      Stampa
    </button>
  );
}

