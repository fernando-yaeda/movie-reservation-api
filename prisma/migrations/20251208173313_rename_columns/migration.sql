/*
  Warnings:

  - You are about to drop the column `showTimeId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `runtimeInMinuts` on the `movies` table. All the data in the column will be lost.
  - You are about to drop the column `showTimeId` on the `showtime_seats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[showtimeId,seatId]` on the table `showtime_seats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `showtimeId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `runtimeInMinutes` to the `movies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `showtimeId` to the `showtime_seats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_showTimeId_fkey";

-- DropForeignKey
ALTER TABLE "showtime_seats" DROP CONSTRAINT "showtime_seats_showTimeId_fkey";

-- DropIndex
DROP INDEX "showtime_seats_showTimeId_seatId_key";

-- AlterTable
ALTER TABLE "bookings" RENAME COLUMN "showTimeId" TO "showtimeId";

-- AlterTable
ALTER TABLE "movies" RENAME COLUMN "runtimeInMinuts" TO "runtimeInMinutes";

-- AlterTable
ALTER TABLE "showtime_seats" RENAME COLUMN "showTimeId" TO "showtimeId";


-- CreateIndex
CREATE UNIQUE INDEX "showtime_seats_showtimeId_seatId_key" ON "showtime_seats"("showtimeId", "seatId");

-- AddForeignKey
ALTER TABLE "showtime_seats" ADD CONSTRAINT "showtime_seats_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "showtimes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "showtimes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
