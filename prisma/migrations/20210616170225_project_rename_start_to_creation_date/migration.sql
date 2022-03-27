/*
  Warnings:

  - You are about to drop the column `start` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "start",
ADD COLUMN     "create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
