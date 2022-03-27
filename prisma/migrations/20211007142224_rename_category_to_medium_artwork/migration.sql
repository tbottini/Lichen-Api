/*
  Warnings:

  - You are about to drop the column `category` on the `Artwork` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Artwork" DROP COLUMN "category",
ADD COLUMN     "medium" "Medium";
