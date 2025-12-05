import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateMovieDTO {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  posterUrl: string;

  @IsInt()
  @IsOptional()
  runtimeInMinuts: number;

  @IsString()
  @IsOptional()
  genres: string[];
}
