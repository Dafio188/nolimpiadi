import { DisciplineKind, Tier } from "@prisma/client";

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

export const defaultTierByAthleteName: Record<(typeof athleteNames)[number], Tier> =
  {
    "Pietro": Tier.ALTO,
    "Gustavo B. V.": Tier.ALTO,
    "Valentino B. E.": Tier.ALTO,
    "Claudia B.": Tier.ALTO,
    "Massimo R.": Tier.MEDIO,
    "Alessandro R.": Tier.MEDIO,
    "Alberto R.": Tier.MEDIO,
    "Gianni T.": Tier.MEDIO,
    "Gianluca B.": Tier.BASSO,
    "Stefano M.": Tier.BASSO,
    "Emma T.": Tier.BASSO,
    "Matheus I. C.": Tier.BASSO,
  };

export const defaultCategoryScoreByAthleteName: Record<(typeof athleteNames)[number], number> =
  {
    "Pietro": 100,
    "Gustavo B. V.": 100,
    "Valentino B. E.": 100,
    "Claudia B.": 75,
    "Massimo R.": 75,
    "Alessandro R.": 75,
    "Alberto R.": 50,
    "Gianni T.": 50,
    "Gianluca B.": 50,
    "Stefano M.": 25,
    "Emma T.": 25,
    "Matheus I. C.": 25,
  };

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
    coefficient: 21,
    teamSize: 1,
    targetFixed: 4,
    targetMin: null,
    targetMax: null,
  },
] as const;

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
