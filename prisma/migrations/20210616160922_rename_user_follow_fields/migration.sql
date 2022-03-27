/*
  Warnings:

  - You are about to drop the column `userFollowId` on the `UserFollow` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserFollow` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserFollow" DROP CONSTRAINT "UserFollow_userFollowId_fkey";

-- DropForeignKey
ALTER TABLE "UserFollow" DROP CONSTRAINT "UserFollow_userId_fkey";

-- AlterTable
ALTER TABLE "UserFollow" DROP COLUMN "userFollowId",
DROP COLUMN "userId",
ADD COLUMN     "userFollowedId" INTEGER,
ADD COLUMN     "userFollowingId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD FOREIGN KEY ("userFollowingId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD FOREIGN KEY ("userFollowedId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
