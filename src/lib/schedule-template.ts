import { DisciplineKind } from "@prisma/client";

export type TemplateSeries = {
  [DisciplineKind.CALCIO_BALILLA]: { teamA: [string, string]; teamB: [string, string] };
  [DisciplineKind.FRECCETTE]: [string, string];
  [DisciplineKind.PING_PONG]: [string, string];
  [DisciplineKind.AIR_HOCKEY]: [string, string];
};

export const QUALIFICATION_TEMPLATE: TemplateSeries[] = [
  // 1° TURNO (Markdown) -> Serie 1-8
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["D", "L"], teamB: ["H", "K"] },
    [DisciplineKind.FRECCETTE]: ["A", "E"],
    [DisciplineKind.PING_PONG]: ["C", "G"],
    [DisciplineKind.AIR_HOCKEY]: ["B", "F"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["H", "J"], teamB: ["A", "F"] },
    [DisciplineKind.FRECCETTE]: ["G", "L"],
    [DisciplineKind.PING_PONG]: ["D", "I"],
    [DisciplineKind.AIR_HOCKEY]: ["C", "E"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["C", "I"], teamB: ["D", "E"] },
    [DisciplineKind.FRECCETTE]: ["B", "H"],
    [DisciplineKind.PING_PONG]: ["K", "L"],
    [DisciplineKind.AIR_HOCKEY]: ["F", "J"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["F", "L"], teamB: ["G", "J"] },
    [DisciplineKind.FRECCETTE]: ["C", "H"],
    [DisciplineKind.PING_PONG]: ["B", "E"],
    [DisciplineKind.AIR_HOCKEY]: ["A", "I"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["E", "K"], teamB: ["B", "L"] },
    [DisciplineKind.FRECCETTE]: ["G", "I"],
    [DisciplineKind.PING_PONG]: ["A", "H"],
    [DisciplineKind.AIR_HOCKEY]: ["D", "J"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["B", "I"], teamB: ["A", "L"] },
    [DisciplineKind.FRECCETTE]: ["D", "F"],
    [DisciplineKind.PING_PONG]: ["E", "J"],
    [DisciplineKind.AIR_HOCKEY]: ["G", "K"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["A", "K"], teamB: ["F", "I"] },
    [DisciplineKind.FRECCETTE]: ["C", "J"],
    [DisciplineKind.PING_PONG]: ["B", "G"],
    [DisciplineKind.AIR_HOCKEY]: ["D", "H"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["D", "G"], teamB: ["C", "K"] },
    [DisciplineKind.FRECCETTE]: ["H", "J"],
    [DisciplineKind.PING_PONG]: ["F", "I"],
    [DisciplineKind.AIR_HOCKEY]: ["A", "L"],
  },

  // 2° TURNO (Markdown) -> Serie 9-16
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["E", "H"], teamB: ["C", "G"] },
    [DisciplineKind.FRECCETTE]: ["F", "K"],
    [DisciplineKind.PING_PONG]: ["A", "J"],
    [DisciplineKind.AIR_HOCKEY]: ["B", "L"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["F", "J"], teamB: ["H", "I"] },
    [DisciplineKind.FRECCETTE]: ["A", "B"],
    [DisciplineKind.PING_PONG]: ["C", "D"],
    [DisciplineKind.AIR_HOCKEY]: ["E", "K"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["D", "K"], teamB: ["B", "J"] },
    [DisciplineKind.FRECCETTE]: ["E", "I"],
    [DisciplineKind.PING_PONG]: ["F", "G"],
    [DisciplineKind.AIR_HOCKEY]: ["C", "L"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["A", "J"], teamB: ["D", "E"] },
    [DisciplineKind.FRECCETTE]: ["B", "F"],
    [DisciplineKind.PING_PONG]: ["H", "L"],
    [DisciplineKind.AIR_HOCKEY]: ["G", "I"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["F", "G"], teamB: ["H", "I"] },
    [DisciplineKind.FRECCETTE]: ["D", "L"],
    [DisciplineKind.PING_PONG]: ["C", "E"],
    [DisciplineKind.AIR_HOCKEY]: ["A", "K"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["C", "I"], teamB: ["A", "E"] },
    [DisciplineKind.FRECCETTE]: ["G", "K"],
    [DisciplineKind.PING_PONG]: ["F", "L"],
    [DisciplineKind.AIR_HOCKEY]: ["B", "H"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["B", "G"], teamB: ["E", "L"] },
    [DisciplineKind.FRECCETTE]: ["A", "I"],
    [DisciplineKind.PING_PONG]: ["H", "K"],
    [DisciplineKind.AIR_HOCKEY]: ["C", "J"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["K", "L"], teamB: ["G", "J"] },
    [DisciplineKind.FRECCETTE]: ["C", "D"],
    [DisciplineKind.PING_PONG]: ["A", "B"],
    [DisciplineKind.AIR_HOCKEY]: ["E", "H"],
  },

  // 3° TURNO (Markdown) -> Serie 17-24
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["A", "I"], teamB: ["C", "F"] },
    [DisciplineKind.FRECCETTE]: ["E", "J"],
    [DisciplineKind.PING_PONG]: ["B", "K"],
    [DisciplineKind.AIR_HOCKEY]: ["D", "G"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["B", "H"], teamB: ["C", "F"] },
    [DisciplineKind.FRECCETTE]: ["K", "L"],
    [DisciplineKind.PING_PONG]: ["D", "J"],
    [DisciplineKind.AIR_HOCKEY]: ["E", "I"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["C", "E"], teamB: ["B", "K"] },
    [DisciplineKind.FRECCETTE]: ["D", "H"],
    [DisciplineKind.PING_PONG]: ["I", "J"],
    [DisciplineKind.AIR_HOCKEY]: ["A", "F"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["A", "H"], teamB: ["D", "G"] },
    [DisciplineKind.FRECCETTE]: ["C", "L"],
    [DisciplineKind.PING_PONG]: ["F", "K"],
    [DisciplineKind.AIR_HOCKEY]: ["B", "I"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["B", "E"], teamB: ["H", "L"] },
    [DisciplineKind.FRECCETTE]: ["A", "G"],
    [DisciplineKind.PING_PONG]: ["D", "I"],
    [DisciplineKind.AIR_HOCKEY]: ["C", "J"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["C", "G"], teamB: ["A", "J"] },
    [DisciplineKind.FRECCETTE]: ["B", "F"],
    [DisciplineKind.PING_PONG]: ["E", "L"],
    [DisciplineKind.AIR_HOCKEY]: ["D", "K"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["D", "F"], teamB: ["I", "L"] },
    [DisciplineKind.FRECCETTE]: ["J", "K"],
    [DisciplineKind.PING_PONG]: ["A", "C"],
    [DisciplineKind.AIR_HOCKEY]: ["G", "H"],
  },
  {
    [DisciplineKind.CALCIO_BALILLA]: { teamA: ["J", "K"], teamB: ["B", "D"] },
    [DisciplineKind.FRECCETTE]: ["E", "I"],
    [DisciplineKind.PING_PONG]: ["G", "H"],
    [DisciplineKind.AIR_HOCKEY]: ["F", "L"],
  },
];
