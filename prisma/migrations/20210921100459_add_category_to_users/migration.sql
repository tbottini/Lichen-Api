/*
  Warnings:

  - The `medium` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "medium",
ADD COLUMN     "medium" "Category";

-- DropEnum
DROP TYPE "Medium";
