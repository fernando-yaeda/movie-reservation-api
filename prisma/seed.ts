import { PrismaPg } from '@prisma/adapter-pg';
import {
  UserRole,
  SeatStatus,
  BookingStatus,
  PrismaClient,
} from '../generated/prisma/client';
import { hash } from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  console.log('Starting seed...');

  // 1. Create Users
  console.log('Creating users...');
  const hashedPassword = await hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@cinema.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    }),
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

  console.log(`Created ${users.length} users`);

  // 2. Create Movies
  console.log('Creating movies...');
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
        runtimeInMinutes: 100,
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
        runtimeInMinutes: 115,
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
        runtimeInMinutes: 157,
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
        runtimeInMinutes: 108,
      },
    }),
  ]);

  console.log(`Created ${movies.length} movies`);

  // 3. Create Rooms with Seats
  console.log('Creating rooms and seats...');

  async function createRoomWithSeats(
    name: string,
    rows: number,
    seatsPerRow: number,
  ) {
    const room = await prisma.room.create({
      data: {
        name,
        capacity: rows * seatsPerRow,
      },
    });

    const seatsData: Array<{
      roomId: string;
      row: string;
      number: string;
    }> = [];
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        seatsData.push({
          roomId: room.id,
          row: rowLetters[rowIndex],
          number: seatNum.toString(),
        });
      }
    }

    await prisma.seat.createMany({ data: seatsData });

    const seats = await prisma.seat.findMany({
      where: { roomId: room.id },
    });

    return { room, seats };
  }

  const room1 = await createRoomWithSeats('Room 1', 6, 10); // 60 seats
  const room2 = await createRoomWithSeats('Room 2', 10, 10); // 100 seats
  const room3 = await createRoomWithSeats('Room 3', 10, 15); // 150 seats
  const room4 = await createRoomWithSeats('Room IMAX', 10, 20); // 200 seats

  const rooms = [room1, room2, room3, room4];
  console.log(`Created ${rooms.length} rooms with seats`);

  // 4. Create Showtimes WITHOUT conflicts
  console.log('Creating showtimes...');

  const allShowtimes: Array<{
    id: string;
    createdAt: Date;
    roomId: string;
    startTime: Date;
    priceInCents: number;
    movieId: string;
  }> = [];

  // Create today and tomorrow dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Schedule configuration
  const movieRoomAssignments = [
    { movie: movies[0], room: room1.room },
    { movie: movies[1], room: room2.room },
    { movie: movies[2], room: room3.room },
    { movie: movies[3], room: room4.room },
  ];

  for (const day of [today, tomorrow]) {
    for (let i = 0; i < movieRoomAssignments.length; i++) {
      const { movie, room } = movieRoomAssignments[i];

      // Create 3 showtimes per day for each room
      const timeSlots = [
        { hour: 10, minute: 0, price: 2500 },
        { hour: 14, minute: 30, price: 3000 },
        { hour: 19, minute: 0, price: 3500 },
      ];

      for (const timeSlot of timeSlots) {
        const showtimeDate = new Date(day);
        showtimeDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

        // Verify no conflict
        const existingShowtime = await prisma.showtime.findFirst({
          where: {
            roomId: room.id,
            startTime: showtimeDate,
          },
        });

        if (!existingShowtime) {
          const showtime = await prisma.showtime.create({
            data: {
              startTime: showtimeDate,
              priceInCents: timeSlot.price,
              movieId: movie.id,
              roomId: room.id,
            },
          });

          allShowtimes.push(showtime);
        }
      }
    }
  }

  console.log(`Created ${allShowtimes.length} showtimes`);

  // 5. CRITICAL: Create ShowtimeSeats for EACH showtime
  console.log('Creating showtime seats...');

  for (const showtime of allShowtimes) {
    const roomData = rooms.find((r) => r.room.id === showtime.roomId);

    if (roomData) {
      // Create ShowtimeSeats entry for each seat in the room
      const showtimeSeatsData = roomData.seats.map((seat) => ({
        showtimeId: showtime.id,
        seatId: seat.id,
        status: SeatStatus.AVAILABLE,
      }));

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < showtimeSeatsData.length; i += batchSize) {
        const batch = showtimeSeatsData.slice(i, i + batchSize);
        await prisma.showtimeSeats.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      console.log(
        `Created ${showtimeSeatsData.length} showtime seats for showtime ${showtime.id}`,
      );
    }
  }

  // 6. Create sample booking
  console.log('Creating sample booking...');

  if (allShowtimes.length > 0 && room1.seats.length >= 4) {
    const showtime = allShowtimes[0];
    const seatsToBook = room1.seats.slice(0, 4);
    const seatLabels = seatsToBook.map((s) => `${s.row}${s.number}`);

    const booking = await prisma.booking.create({
      data: {
        seats: seatLabels,
        totalPriceInCents: showtime.priceInCents * 4,
        userId: users[1].id, // John
        showtimeId: showtime.id,
        status: BookingStatus.CONFIRMED,
      },
    });

    // Update seat status to RESERVED
    for (const seat of seatsToBook) {
      await prisma.showtimeSeats.updateMany({
        where: {
          showtimeId: showtime.id,
          seatId: seat.id,
        },
        data: {
          status: SeatStatus.RESERVED,
          bookingId: booking.id,
        },
      });
    }

    console.log(
      `Created booking ${booking.id} with ${seatLabels.length} seats`,
    );
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
