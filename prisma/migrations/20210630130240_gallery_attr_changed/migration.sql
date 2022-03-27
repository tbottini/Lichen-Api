/*
  Warnings:

  - You are about to drop the column `galleryId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Gallery` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Gallery` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_galleryId_fkey";

-- DropIndex
DROP INDEX "User_galleryId_unique";

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "galleryId";

-- CreateIndex
CREATE UNIQUE INDEX "Gallery_userId_unique" ON "Gallery"("userId");

-- AddForeignKey
ALTER TABLE "Gallery" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
