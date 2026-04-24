-- AlterTable
ALTER TABLE "athletes" ADD COLUMN     "category_score" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "malus_divisor" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
