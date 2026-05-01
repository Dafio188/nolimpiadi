import { DisciplineKind } from "@prisma/client";
import { TOURNAMENT_CALENDAR } from "@/data/tournament-calendar";

export type TemplateSeries = {
  [DisciplineKind.CALCIO_BALILLA]: { teamA: [string, string]; teamB: [string, string] };
  [DisciplineKind.FRECCETTE]: [string, string];
  [DisciplineKind.PING_PONG]: [string, string];
  [DisciplineKind.AIR_HOCKEY]: [string, string];
};

export const QUALIFICATION_TEMPLATE: TemplateSeries[] = TOURNAMENT_CALENDAR.flat().map((match) => ({
  [DisciplineKind.CALCIO_BALILLA]: {
    teamA: match.cb[0] as [string, string],
    teamB: match.cb[1] as [string, string],
  },
  [DisciplineKind.FRECCETTE]: match.fr.flat() as [string, string],
  [DisciplineKind.PING_PONG]: match.pp.flat() as [string, string],
  [DisciplineKind.AIR_HOCKEY]: (match.ah || (match as any).bk).flat() as [string, string],
}));
