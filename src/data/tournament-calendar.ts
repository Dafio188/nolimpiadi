import { DisciplineKind } from "@prisma/client";

export type CalendarMatch = {
  cb: [string[], string[]]; // Calcio-balilla (doppio)
  fr: [string[], string[]]; // Freccette (singolo)
  pp: [string[], string[]]; // Ping-pong (singolo)
  ah: [string[], string[]]; // Air Hockey (singolo)
};

export const TOURNAMENT_CALENDAR: CalendarMatch[][] = [
  // 1° TURNO
  [
    { cb: [["D", "L"], ["H", "K"]], fr: [["A"], ["E"]], pp: [["C"], ["G"]], ah: [["B"], ["F"]] },
    { cb: [["H", "J"], ["A", "F"]], fr: [["G"], ["L"]], pp: [["D"], ["I"]], ah: [["C"], ["E"]] },
    { cb: [["C", "I"], ["D", "E"]], fr: [["B"], ["H"]], pp: [["K"], ["L"]], ah: [["F"], ["J"]] },
    { cb: [["F", "L"], ["G", "J"]], fr: [["C"], ["H"]], pp: [["B"], ["E"]], ah: [["A"], ["I"]] },
    { cb: [["E", "K"], ["B", "L"]], fr: [["G"], ["I"]], pp: [["A"], ["H"]], ah: [["D"], ["J"]] },
    { cb: [["B", "I"], ["A", "L"]], fr: [["D"], ["F"]], pp: [["E"], ["J"]], ah: [["G"], ["K"]] },
    { cb: [["A", "K"], ["F", "I"]], fr: [["C"], ["J"]], pp: [["B"], ["G"]], ah: [["D"], ["H"]] },
    { cb: [["D", "G"], ["C", "K"]], fr: [["H"], ["J"]], pp: [["F"], ["I"]], ah: [["A"], ["L"]] },
  ],
  // 2° TURNO
  [
    { cb: [["E", "H"], ["C", "G"]], fr: [["F"], ["K"]], pp: [["A"], ["J"]], ah: [["B"], ["L"]] },
    { cb: [["F", "J"], ["H", "I"]], fr: [["A"], ["B"]], pp: [["C"], ["D"]], ah: [["E"], ["K"]] },
    { cb: [["D", "K"], ["B", "J"]], fr: [["E"], ["I"]], pp: [["F"], ["G"]], ah: [["C"], ["L"]] },
    { cb: [["A", "J"], ["D", "E"]], fr: [["B"], ["F"]], pp: [["H"], ["L"]], ah: [["G"], ["I"]] },
    { cb: [["F", "G"], ["H", "I"]], fr: [["D"], ["L"]], pp: [["C"], ["E"]], ah: [["A"], ["K"]] },
    { cb: [["C", "I"], ["A", "E"]], fr: [["G"], ["K"]], pp: [["F"], ["L"]], ah: [["B"], ["H"]] },
    { cb: [["B", "G"], ["E", "L"]], fr: [["A"], ["I"]], pp: [["H"], ["K"]], ah: [["C"], ["J"]] },
    { cb: [["K", "L"], ["G", "J"]], fr: [["C"], ["D"]], pp: [["A"], ["B"]], ah: [["E"], ["H"]] },
  ],
  // 3° TURNO
  [
    { cb: [["A", "I"], ["C", "F"]], fr: [["E"], ["J"]], pp: [["B"], ["K"]], ah: [["D"], ["G"]] },
    { cb: [["B", "H"], ["C", "F"]], fr: [["K"], ["L"]], pp: [["D"], ["J"]], ah: [["E"], ["I"]] },
    { cb: [["C", "E"], ["B", "K"]], fr: [["D"], ["H"]], pp: [["I"], ["J"]], ah: [["A"], ["F"]] },
    { cb: [["A", "H"], ["D", "G"]], fr: [["C"], ["L"]], pp: [["F"], ["K"]], ah: [["B"], ["I"]] },
    { cb: [["B", "E"], ["H", "L"]], fr: [["A"], ["G"]], pp: [["D"], ["I"]], ah: [["C"], ["J"]] },
    { cb: [["C", "G"], ["A", "J"]], fr: [["B"], ["F"]], pp: [["E"], ["L"]], ah: [["D"], ["K"]] }, // Note: bk used in some parts of code
    { cb: [["D", "F"], ["I", "L"]], fr: [["J"], ["K"]], pp: [["A"], ["C"]], ah: [["G"], ["H"]] },
    { cb: [["J", "K"], ["B", "D"]], fr: [["E"], ["I"]], pp: [["G"], ["H"]], ah: [["F"], ["L"]] },
  ],
];

// Helper per mappare le chiavi del calendario ai DisciplineKind di Prisma
export const DISCIPLINE_KEY_MAP: Record<string, DisciplineKind> = {
  cb: DisciplineKind.CALCIO_BALILLA,
  fr: DisciplineKind.FRECCETTE,
  pp: DisciplineKind.PING_PONG,
  ah: DisciplineKind.AIR_HOCKEY,
  bk: DisciplineKind.AIR_HOCKEY, // Alias usato storicamente nel codice
};
