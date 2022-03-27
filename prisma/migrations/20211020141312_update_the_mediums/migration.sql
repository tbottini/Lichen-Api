/*
  Warnings:

  - The values [PAINT,PERFORMANCE,POLYVALENT,DESIGN] on the enum `Medium` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Medium_new" AS ENUM ('LIVING_ARTS', 'DRAWING', 'EDITING', 'STAMP', 'INSTALLATION', 'PAINTING', 'PHOTOGRAPH', 'SCULPTURE', 'STREET_ART', 'MIXED_TECHNIQUE', 'AUDIOVISUAL');
ALTER TABLE "User" ALTER COLUMN "medium" TYPE "Medium_new" USING ("medium"::text::"Medium_new");
ALTER TABLE "Project" ALTER COLUMN "medium" TYPE "Medium_new" USING ("medium"::text::"Medium_new");
ALTER TABLE "Artwork" ALTER COLUMN "medium" TYPE "Medium_new" USING ("medium"::text::"Medium_new");
ALTER TABLE "Event" ALTER COLUMN "medium" TYPE "Medium_new" USING ("medium"::text::"Medium_new");
ALTER TYPE "Medium" RENAME TO "Medium_old";
ALTER TYPE "Medium_new" RENAME TO "Medium";
DROP TYPE "Medium_old";
COMMIT;
