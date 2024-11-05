/*
  Warnings:

  - Added the required column `question` to the `response` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "response" ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "score" INTEGER;
