ALTER TABLE "system_settings"
ADD COLUMN "turn_duration_minutes" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "matches"
ADD COLUMN "planned_slot_id" TEXT;

CREATE UNIQUE INDEX "matches_planned_slot_id_key" ON "matches"("planned_slot_id");

CREATE TABLE "qualification_turns" (
  "id" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "scheduled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "qualification_turns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qualification_turns_index_key" ON "qualification_turns"("index");

CREATE TABLE "qualification_slots" (
  "id" TEXT NOT NULL,
  "turn_id" TEXT NOT NULL,
  "discipline_id" TEXT NOT NULL,
  "kind" "DisciplineKind" NOT NULL,
  "target_victory" INTEGER NOT NULL,
  "side1_athlete_ids" TEXT[] NOT NULL,
  "side2_athlete_ids" TEXT[] NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "qualification_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qualification_slots_turn_id_kind_key" ON "qualification_slots"("turn_id", "kind");
CREATE INDEX "qualification_slots_turn_id_idx" ON "qualification_slots"("turn_id");

ALTER TABLE "qualification_slots"
ADD CONSTRAINT "qualification_slots_turn_id_fkey"
FOREIGN KEY ("turn_id") REFERENCES "qualification_turns"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "qualification_slots"
ADD CONSTRAINT "qualification_slots_discipline_id_fkey"
FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "matches"
ADD CONSTRAINT "matches_planned_slot_id_fkey"
FOREIGN KEY ("planned_slot_id") REFERENCES "qualification_slots"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
