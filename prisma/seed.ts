/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// prisma/seed.ts
import {
  UserRole,
  SeatStatus,
  BookingStatus,
  PrismaClient,
} from '../generated/prisma/client';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await hash('password', 12);

  const regularUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        password: hashedPassword,
        role: UserRole.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        password: hashedPassword,
        role: UserRole.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        password: hashedPassword,
        role: UserRole.USER,
      },
    }),
  ]);

  console.log(`✅ Created ${regularUsers.length + 1} users`);

  // 2. Create Movies
  console.log('🎬 Creating movies...');
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        imdbId: 'tt2948372',
        title: 'Soul',
        description:
          'After landing the gig of a lifetime, a New York jazz pianist suddenly finds himself trapped in a strange land between Earth and the afterlife.',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg',
        genres: ['Animation', 'Comedy', 'Drama', 'Family', 'Fantasy', 'Music'],
        runtimeInMinuts: 100,
      },
    }),
    prisma.movie.create({
      data: {
        imdbId: 'tt6264654',
        title: 'Free Guy',
        description:
          'A bank teller discovers he is actually a background player in an open-world video game.',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/xmbU4JTUm8rsdtn7Y3Fcm30GpeT.jpg',
        genres: ['Action', 'Comedy', 'Sci-Fi'],
        runtimeInMinuts: 115,
      },
    }),
    prisma.movie.create({
      data: {
        imdbId: 'tt9032400',
        title: 'Eternals',
        description:
          'The saga of the Eternals, a race of immortal beings who lived on Earth and shaped its history and civilizations.',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/bcCBq9N1EMo3daNIjWJ8kYvrQm6.jpg',
        genres: ['Action', 'Adventure', 'Fantasy', 'Sci-Fi'],
        runtimeInMinuts: 157,
      },
    }),
    prisma.movie.create({
      data: {
        imdbId: 'tt8847712',
        title: 'The French Dispatch',
        description:
          'A love letter to journalists set in an outpost of an American newspaper in a fictional twentieth century French city.',
        posterUrl:
          'https://image.tmdb.org/t/p/w500/61J34xH6eL4a8LFBX7J7HqmRZh6.jpg',
        genres: ['Comedy', 'Drama', 'Romance'],
        runtimeInMinuts: 108,
      },
    }),
  ]);

  console.log(`✅ Created ${movies.length} movies`);

  // 3. Create Rooms with Seats
  console.log('🎭 Creating rooms and seats...');

  const rooms = await Promise.all([
    // Room 1 - Small Room (60 seats)
    createRoomWithSeats('Sala 1', 60, 6, 10),
    // Room 2 - Medium Room (100 seats)
    createRoomWithSeats('Sala 2', 100, 10, 10),
    // Room 3 - Large Room (150 seats)
    createRoomWithSeats('Sala 3', 150, 10, 15),
    // Room 4 - IMAX Room (200 seats)
    createRoomWithSeats('Sala IMAX', 200, 10, 20),
  ]);

  console.log(`✅ Created ${rooms.length} rooms with seats`);

  // 4. Create ShowTimes
  console.log('⏰ Creating showtimes...');

  // Helper to create showtimes for a movie in different rooms
  async function createShowtimesForMovie(movieId: string, baseDate: Date) {
    const showtimes: Promise<import('generated/prisma/client').ShowTime>[] = [];

    // Create showtimes for each room
    for (const room of rooms) {
      // Morning show
      const morningShow = new Date(baseDate);
      morningShow.setHours(10, 0, 0, 0);

      // Afternoon show
      const afternoonShow = new Date(baseDate);
      afternoonShow.setHours(14, 30, 0, 0);

      // Evening show
      const eveningShow = new Date(baseDate);
      eveningShow.setHours(19, 0, 0, 0);

      // Night show
      const nightShow = new Date(baseDate);
      nightShow.setHours(22, 0, 0, 0);

      showtimes.push(
        prisma.showTime.create({
          data: {
            startTime: morningShow,
            priceInCents: 2500, // $25.00
            movieId,
            roomId: room.id,
          },
        }),
        prisma.showTime.create({
          data: {
            startTime: afternoonShow,
            priceInCents: 3000, // $30.00
            movieId,
            roomId: room.id,
          },
        }),
        prisma.showTime.create({
          data: {
            startTime: eveningShow,
            priceInCents: 3500, // $35.00
            movieId,
            roomId: room.id,
          },
        }),
      );
    }

    return Promise.all(showtimes);
  }

  // Create showtimes for today and tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let allShowtimes: import('generated/prisma/client').ShowTime[] = [];

  for (const movie of movies) {
    const todaysShowtimes = await createShowtimesForMovie(movie.id, today);
    const tomorrowsShowtimes = await createShowtimesForMovie(
      movie.id,
      tomorrow,
    );

    allShowtimes = [...allShowtimes, ...todaysShowtimes, ...tomorrowsShowtimes];
  }

  console.log(`✅ Created ${allShowtimes.length} showtimes`);

  // 5. Create ShowTimeSeats entries (initialize all seats as AVAILABLE)
  console.log('💺 Initializing seat status for showtimes...');

  // For simplicity, let's initialize seats for first 5 showtimes
  const showtimesToInitialize = allShowtimes.slice(0, 5);

  for (const showtime of showtimesToInitialize) {
    const room = await prisma.room.findUnique({
      where: { id: showtime.roomId },
      include: { seats: true },
    });

    if (room && room.seats.length > 0) {
      const seatStatuses = room.seats.map((seat) => ({
        showTimeId: showtime.id,
        seatId: seat.id,
        status: SeatStatus.AVAILABLE,
      }));

      // Create in batches of 50 to avoid too many parameters
      for (let i = 0; i < seatStatuses.length; i += 50) {
        const batch = seatStatuses.slice(i, i + 50);
        await prisma.showTimeSeats.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      console.log(
        `✅ Initialized ${room.seats.length} seats for showtime ${showtime.id}`,
      );
    }
  }

  // 6. Create Sample Bookings (optional - for testing)
  console.log('🎟️ Creating sample bookings...');

  // Let's create a booking for the first showtime
  const firstShowtime = allShowtimes[0];
  const firstRoom = rooms.find((r) => r.id === firstShowtime.roomId);

  if (firstRoom) {
    // Get some seats from the room
    const roomSeats = await prisma.seat.findMany({
      where: { roomId: firstRoom.id },
      take: 4,
    });

    if (roomSeats.length >= 4) {
      const seatLabels = roomSeats.map((seat) => `${seat.row}${seat.number}`);

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          seats: seatLabels,
          totalPriceInCents: firstShowtime.priceInCents * 4,
          userId: regularUsers[0].id,
          showTimeId: firstShowtime.id,
          status: BookingStatus.CONFIRMED,
        },
      });

      // Update seat status to RESERVED
      await Promise.all(
        roomSeats.map((seat) =>
          prisma.showTimeSeats.updateMany({
            where: {
              showTimeId: firstShowtime.id,
              seatId: seat.id,
            },
            data: {
              status: SeatStatus.RESERVED,
              bookingId: booking.id,
            },
          }),
        ),
      );

      console.log(
        `✅ Created sample booking ${booking.id} with ${seatLabels.length} seats`,
      );
    }
  }

  console.log('🎉 Seed completed successfully!');
}

async function createRoomWithSeats(
  name: string,
  capacity: number,
  rows: number,
  seatsPerRow: number,
) {
  // Create room
  const room = await prisma.room.create({
    data: {
      name,
      capacity,
    },
  });

  // Create seats for the room
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const seats: { roomId: string; row: string; number: string }[] = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const rowLetter = rowLetters[rowIndex];

    for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
      seats.push({
        roomId: room.id,
        row: rowLetter,
        number: seatNum.toString(),
      });
    }
  }

  // Insert seats in batches
  for (let i = 0; i < seats.length; i += 100) {
    const batch = seats.slice(i, i + 100);
    await prisma.seat.createMany({
      data: batch,
    });
  }

  return room;
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
