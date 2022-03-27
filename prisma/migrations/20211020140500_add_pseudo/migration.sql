-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pseudo" TEXT;

-- RenameIndex
ALTER INDEX "Gallery_userId_unique" RENAME TO "Gallery_userId_key";
