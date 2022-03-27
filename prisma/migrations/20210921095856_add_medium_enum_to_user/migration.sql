-- CreateEnum
CREATE TYPE "Medium" AS ENUM ('POLYVALENT', 'DRAWER', 'PAINTER', 'SCULPTOR', 'DESIGNER', 'PERFORMER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "medium" "Medium";
