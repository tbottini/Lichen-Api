/*
  Warnings:

  - A unique constraint covering the columns `[galleryId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "galleryId" INTEGER;

-- CreateTable
CREATE TABLE "Gallery" (
    "id" SERIAL NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "lagitude" DOUBLE PRECISION NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_galleryId_unique" ON "User"("galleryId");

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
