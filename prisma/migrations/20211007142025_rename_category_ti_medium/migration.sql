/*
  Warnings:

  - The `category` column on the `Artwork` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `medium` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `medium` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `medium` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Medium" AS ENUM ('PAINT', 'DRAWING', 'SCULPTURE', 'PERFORMANCE', 'POLYVALENT', 'DESIGN');

-- AlterTable
ALTER TABLE "Artwork" DROP COLUMN "category",
ADD COLUMN     "category" "Medium";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "medium",
ADD COLUMN     "medium" "Medium";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "medium",
ADD COLUMN     "medium" "Medium";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "medium",
ADD COLUMN     "medium" "Medium";

-- DropEnum
DROP TYPE "Category";
