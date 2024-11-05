/*
  Warnings:

  - Added the required column `status` to the `response` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "response" ADD COLUMN     "status" "Status" NOT NULL;
