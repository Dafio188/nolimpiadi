import { DisciplineKind } from "@prisma/client";

export const athleteNames = [
  "Pietro",
  "Gustavo B. V.",
  "Valentino B. E.",
  "Claudia B.",
  "Massimo R.",
  "Alessandro R.",
  "Alberto R.",
  "Gianni T.",
  "Gianluca B.",
  "Stefano M.",
  "Emma T.",
  "Matheus I. C.",
] as const;

export const disciplineSeeds = [
  {
    kind: DisciplineKind.CALCIO_BALILLA,
    name: "Calcio-balilla",
    coefficient: 21,
    teamSize: 2,
    targetFixed: 4,
    targetMin: null,
    targetMax: null,
  },
  {
    kind: DisciplineKind.FRECCETTE,
    name: "Freccette",
    coefficient: 1,
    teamSize: 1,
    targetFixed: 220,
    targetMin: null,
    targetMax: null,
  },
  {
    kind: DisciplineKind.PING_PONG,
    name: "Ping-pong",
    coefficient: 15,
    teamSize: 1,
    targetFixed: 11,
    targetMin: null,
    targetMax: null,
  },
  {
    kind: DisciplineKind.AIR_HOCKEY,
    name: "Air Hockey",
    coefficient: 1,
    teamSize: 1,
    targetFixed: 10,
    targetMin: null,
    targetMax: null,
  },
] as const;

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
