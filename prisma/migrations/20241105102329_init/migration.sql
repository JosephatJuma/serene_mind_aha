/*
  Warnings:

  - You are about to drop the column `lastScreenDate` on the `client` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Scale" AS ENUM ('MINIMAL_OR_NONE', 'SEVERE', 'MILD', 'MODERATE');

-- AlterTable
ALTER TABLE "client" DROP COLUMN "lastScreenDate",
ADD COLUMN     "axientyScale" "Scale",
ADD COLUMN     "axientyScore" INTEGER,
ADD COLUMN     "depressionScale" "Scale",
ADD COLUMN     "depressionScore" INTEGER,
ADD COLUMN     "lastScreeningDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "response" ADD COLUMN     "timestamp" BIGINT;
