import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMoviesAndShowtimesByDate(date: Date) {
    const initialDate = new Date(date);
    const finalDate = new Date(date.setDate(date.getDate() + 1));

    return await this.prismaService.movie.findMany({
      where: {
        showtimes: {
          some: {
            startTime: {
              gte: initialDate,
              lt: finalDate,
            },
          },
        },
      },
      include: {
        showtimes: {
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });
  }

  async getAvailableSeatsByShowtime(showtimeId: string) {
    return await this.prismaService.showTimeSeats.findMany({
      where: {
        showTimeId: showtimeId,
        status: 'AVAILABLE',
        bookingId: null,
      },
      include: {
        seat: true,
        showtime: {
          include: {
            room: {
              select: {
                id: true,
                name: true,
                capacity: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          seat: {
            row: 'asc',
          },
        },
        {
          seat: {
            number: 'asc',
          },
        },
      ],
    });
  }
}
