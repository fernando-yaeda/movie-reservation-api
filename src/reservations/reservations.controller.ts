import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservation.service';
import { GetCurrentUser } from 'src/auth/decorators/get-current-user.decorator';
import type { User } from 'generated/prisma/client';
import { CreateReservationDTO } from './dto/create-reservation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('/reservations')
export class ReservationsContoller {
  constructor(private readonly reservationService: ReservationsService) {}

  @Get('/scheduled')
  async getMoviesAndShowtimesByDate(@Query('date') date: string) {
    const formatedDate = new Date(date);
    return await this.reservationService.getMoviesWithShowtimesForDate(
      formatedDate,
    );
  }

  @Get(':showtimeId')
  async getSeatsByShowtimeId(@Param('showtimeId') showtimeId: string) {
    return await this.reservationService.getSeatsForShowtime(showtimeId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReservation(
    @GetCurrentUser() user: User,
    @Body() createReservationDto: CreateReservationDTO,
  ) {
    return await this.reservationService.createBooking(
      user.id,
      createReservationDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserReservations(@GetCurrentUser() user: User) {
    return await this.reservationService.getUserBookings(user.id);
  }

  @Post(':reservationId')
  @UseGuards(JwtAuthGuard)
  async cancelReservation(
    @GetCurrentUser() user: User,
    @Param('reservationId') reservationId,
  ) {
    return await this.reservationService.cancelBooking(user.id, reservationId);
  }
}
