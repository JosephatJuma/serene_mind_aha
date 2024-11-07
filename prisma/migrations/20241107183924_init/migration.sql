/*
  Warnings:

  - You are about to drop the column `axientyScale` on the `assessment` table. All the data in the column will be lost.
  - You are about to drop the column `axientyScore` on the `assessment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assessment" DROP COLUMN "axientyScale",
DROP COLUMN "axientyScore",
ADD COLUMN     "anxietyScale" "Scale",
ADD COLUMN     "anxietyScore" INTEGER;
