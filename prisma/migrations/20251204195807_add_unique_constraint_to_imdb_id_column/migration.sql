/*
  Warnings:

  - A unique constraint covering the columns `[imdbId]` on the table `movies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "movies_imdbId_key" ON "movies"("imdbId");
