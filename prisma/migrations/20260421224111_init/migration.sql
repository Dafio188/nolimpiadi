-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('ALTO', 'MEDIO', 'BASSO');

-- CreateEnum
CREATE TYPE "DisciplineKind" AS ENUM ('CALCIO_BALILLA', 'FRECCETTE', 'PING_PONG', 'BASKET');

-- CreateEnum
CREATE TYPE "MatchPhase" AS ENUM ('QUALIFICAZIONE', 'FINALI');

-- CreateEnum
CREATE TYPE "FinalStage" AS ENUM ('QUARTI', 'SEMIFINALI', 'FINALE');

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "kind" "DisciplineKind" NOT NULL,
    "name" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL,
    "team_size" INTEGER NOT NULL,
    "target_min" INTEGER,
    "target_max" INTEGER,
    "target_fixed" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "discipline_id" TEXT NOT NULL,
    "phase" "MatchPhase" NOT NULL,
    "target_victory" INTEGER NOT NULL,
    "final_stage" "FinalStage",
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_sides" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "side" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "match_sides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_side_athletes" (
    "side_id" TEXT NOT NULL,
    "athlete_id" TEXT NOT NULL,

    CONSTRAINT "match_side_athletes_pkey" PRIMARY KEY ("side_id","athlete_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athletes_name_key" ON "athletes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_kind_key" ON "disciplines"("kind");

-- CreateIndex
CREATE INDEX "matches_discipline_id_phase_idx" ON "matches"("discipline_id", "phase");

-- CreateIndex
CREATE INDEX "matches_played_at_idx" ON "matches"("played_at");

-- CreateIndex
CREATE INDEX "match_sides_match_id_idx" ON "match_sides"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_sides_match_id_side_key" ON "match_sides"("match_id", "side");

-- CreateIndex
CREATE INDEX "match_side_athletes_athlete_id_idx" ON "match_side_athletes"("athlete_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_sides" ADD CONSTRAINT "match_sides_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side_athletes" ADD CONSTRAINT "match_side_athletes_side_id_fkey" FOREIGN KEY ("side_id") REFERENCES "match_sides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side_athletes" ADD CONSTRAINT "match_side_athletes_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
