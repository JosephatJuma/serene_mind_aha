/*
  Warnings:

  - You are about to drop the column `axientyScale` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `axientyScore` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `depressionScale` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `depressionScore` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `isScreened` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `lastScreeningDate` on the `client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "client" DROP COLUMN "axientyScale",
DROP COLUMN "axientyScore",
DROP COLUMN "depressionScale",
DROP COLUMN "depressionScore",
DROP COLUMN "isScreened",
DROP COLUMN "lastScreeningDate",
ADD COLUMN     "is_creened" BOOLEAN;

-- CreateTable
CREATE TABLE "assessment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "depressionScore" INTEGER,
    "depressionScale" "Scale",
    "axientyScore" INTEGER,
    "axientyScale" "Scale",
    "period" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
