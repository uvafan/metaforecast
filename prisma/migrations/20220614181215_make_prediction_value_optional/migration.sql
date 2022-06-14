/*
  Warnings:

  - Added the required column `fetched` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "fetched" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "predictionValue" DROP NOT NULL;
