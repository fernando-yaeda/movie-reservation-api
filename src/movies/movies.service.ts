import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { Movie } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMovieDTO } from './dto/create-movie.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  MovieValidator,
  ValidatedMovieData,
} from './validators/omdb-movie-validator';
import { OmdbMovieDTO } from './dto/omdb-movie.dto';
import { UpdateMovieDTO } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly movieValidator: MovieValidator,
  ) {}

  async createMovie(createMovieDto: CreateMovieDTO) {
    let movie: Movie;

    const omdbMovieData = await this.getMovieDataFromOmdb(
      createMovieDto.imdbId,
    );

    const validateMovieData: ValidatedMovieData =
      this.movieValidator.validateAndTransformOmdbMovieData(omdbMovieData);

    try {
      movie = await this.prisma.movie.create({
        data: {
          imdbId: validateMovieData.imdbId,
          title: validateMovieData.title,
          description: validateMovieData.description,
          posterUrl: validateMovieData.posterUrl,
          genres: validateMovieData.genres,
          runtimeInMinutes: validateMovieData.runtimeInMinutes,
        },
      });
    } catch (error) {
      // eslint-disable-next-line
      if (error.code === 'P2002') {
        // eslint-disable-next-line
        const target = error.meta?.target?.[0] || 'field';
        throw new ConflictException(`Movie with ${target} already exists.`);
      }

      throw new InternalServerErrorException(
        'Something went wrong, please try again later.',
      );
    }

    return movie;
  }

  async updateMovie(id: string, updateMovieDto: UpdateMovieDTO) {
    const movie = await this.prisma.movie.findUnique({ where: { imdbId: id } });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return await this.prisma.movie.update({
      where: { imdbId: id },
      data: { ...updateMovieDto },
    });
  }

  async deleteMovie(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return await this.prisma.movie.delete({
      where: { id },
    });
  }

  async getMovies() {
    const movies = await this.prisma.movie.findMany();

    return movies;
  }

  private async getMovieDataFromOmdb(imbdId: string): Promise<OmdbMovieDTO> {
    const url = `https://omdbapi.com/?i=${imbdId}&apikey=dea4d0dd`;

    const response = await firstValueFrom(this.httpService.get(url));

    return response.data as OmdbMovieDTO;
  }
}
