/*
  Warnings:

  - You are about to drop the column `lagitude` on the `Gallery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gallery" DROP COLUMN "lagitude",
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0;
