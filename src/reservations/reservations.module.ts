import { Module } from '@nestjs/common';
import { ReservationsContoller } from './reservations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReservationsService } from './reservation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReservationsContoller],
  providers: [ReservationsService],
  exports: [ReservationsModule],
})
export class ReservationsModule {}
