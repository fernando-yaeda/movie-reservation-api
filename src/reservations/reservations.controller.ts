import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReservationsService } from './reservation.service';

@Controller('/reservations')
export class ReservationsContoller {
  constructor(private readonly reservationService: ReservationsService) {}

  @Get()
  async getMoviesAndShowtimesByDate(@Query('date') date: string) {
    const formatedDate = new Date(date);
    return this.reservationService.getMoviesAndShowtimesByDate(formatedDate);
  }

  @Get(':showtimeId')
  async getAvailableSeatsByShowtimeId(@Param('showtimeId') showtimeId: string) {
    return this.reservationService.getAvailableSeatsByShowtime(showtimeId);
  }
}
