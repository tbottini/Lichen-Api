/*
  Warnings:

  - You are about to drop the column `defaultFilterLatitude` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `defaultFilterLongitude` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "defaultFilterLatitude",
DROP COLUMN "defaultFilterLongitude",
ADD COLUMN     "positionLatitude" DOUBLE PRECISION,
ADD COLUMN     "positionLongitude" DOUBLE PRECISION;
