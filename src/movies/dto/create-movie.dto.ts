import { IsString, Matches } from 'class-validator';

export class CreateMovieDTO {
  @Matches(/t[0-9]{7,}/, {
    message: 'imdbId must be a valid imbd id',
  })
  @IsString()
  imdbId: string;
}
