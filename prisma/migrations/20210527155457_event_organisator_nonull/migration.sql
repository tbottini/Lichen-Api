/*
  Warnings:

  - Made the column `organisatorId` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "organisatorId" SET NOT NULL;
