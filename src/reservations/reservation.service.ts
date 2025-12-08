import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReservationDTO } from './dto/create-reservation.dto';
import { BookingStatus, SeatStatus } from 'generated/prisma/enums';

@Injectable()
export class ReservationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMoviesWithShowtimesForDate(date: Date) {
    const initialDate = new Date(date);
    const finalDate = new Date(date.setDate(date.getDate() + 1));

    return await this.prismaService.movie.findMany({
      where: {
        showtimes: {
          some: {
            startTime: { gte: initialDate, lt: finalDate },
          },
        },
      },
      select: {
        id: true,
        title: true,
        runtimeInMinutes: true,
        posterUrl: true,
        showtimes: {
          where: {
            startTime: { gte: initialDate, lt: finalDate },
          },
          select: {
            id: true,
            startTime: true,
            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });
  }

  async getSeatsForShowtime(showtimeId: string) {
    return await this.prismaService.seat.findMany({
      where: {
        seatStatus: {
          some: { showtimeId },
        },
      },
      select: {
        id: true,
        row: true,
        number: true,
        seatStatus: {
          where: { showtimeId },
          select: {
            status: true,
            bookingId: true,
          },
        },
      },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });
  }

  async createBooking(
    userId: string,
    createReservationDto: CreateReservationDTO,
  ) {
    const { showtimeId, seatIds } = createReservationDto;

    return await this.prismaService.$transaction(async (tx) => {
      const showtime = await tx.showtime.findUnique({
        where: {
          id: showtimeId,
        },
        select: {
          priceInCents: true,
        },
      });

      if (!showtime) {
        throw new NotFoundException('showtime not found');
      }

      const seatsStatus = await tx.showtimeSeats.findMany({
        where: {
          showtimeId,
          seatId: {
            in: seatIds,
          },
        },
        select: {
          id: true,
          seatId: true,
          status: true,
          seat: {
            select: {
              row: true,
              number: true,
            },
          },
        },
      });

      if (seatsStatus.length !== seatIds.length) {
        throw new ConflictException('some seats are unavailable');
      }

      const unavailableSeats = seatsStatus.filter(
        (seat) => seat.status !== SeatStatus.AVAILABLE,
      );

      if (unavailableSeats.length > 0) {
        const seatNumbers = unavailableSeats.map(
          (seat) => `${seat.seat.row}${seat.seat.number}`,
        );
        throw new ConflictException(
          `unavailable seats: ${seatNumbers.join(', ')}`,
        );
      }

      const totalPrice = showtime.priceInCents * seatIds.length;

      const booking = await tx.booking.create({
        data: {
          seats: seatIds,
          totalPriceInCents: totalPrice,
          userId,
          showtimeId,
          status: BookingStatus.CONFIRMED,
          showtimeSeats: {
            connect: seatIds.map((seatId) => ({
              showtimeId_seatId: {
                showtimeId,
                seatId,
              },
            })),
          },
        },
        include: {
          showtime: {
            include: {
              movie: true,
              room: true,
            },
          },
        },
      });

      await tx.showtimeSeats.updateMany({
        where: {
          showtimeId,
          seatId: {
            in: seatIds,
          },
        },
        data: {
          status: SeatStatus.RESERVED,
          bookingId: booking.id,
        },
      });

      const completeBooking = await tx.booking.findUnique({
        where: { id: booking.id },
        select: {
          id: true,
          totalPriceInCents: true,
          status: true,
          showtimeSeats: {
            select: {
              seat: {
                select: {
                  id: true,
                  row: true,
                  number: true,
                },
              },
            },
          },
          showtime: {
            select: {
              id: true,
              startTime: true,
              movie: {
                select: {
                  title: true,
                  posterUrl: true,
                  runtimeInMinutes: true,
                },
              },
              room: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        booking: completeBooking,
        message: `reservation confirmed for ${seatIds.length} seats`,
      };
    });
  }
}
