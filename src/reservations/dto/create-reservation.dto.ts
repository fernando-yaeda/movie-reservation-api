import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateReservationDTO {
  @IsString()
  @IsNotEmpty()
  showtimeId: string;

  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  seatIds: string[];
}
