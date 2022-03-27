/*
  Warnings:

  - You are about to drop the `_ArtworkToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ArtworkToUser" DROP CONSTRAINT "_ArtworkToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_ArtworkToUser" DROP CONSTRAINT "_ArtworkToUser_B_fkey";

-- DropTable
DROP TABLE "_ArtworkToUser";

-- CreateTable
CREATE TABLE "ArtworkLikes" (
    "id" SERIAL NOT NULL,
    "creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "artworkId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArtworkLikes" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkLikes" ADD FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
