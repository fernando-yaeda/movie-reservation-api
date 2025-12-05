import { Injectable, BadRequestException } from '@nestjs/common';
import { OmdbMovieDTO } from '../dto/omdb-movie.dto';

export interface ValidatedMovieData {
  imdbId: string;
  title: string;
  description: string;
  posterUrl: string;
  genres: string[];
  runtimeInMinuts: number;
}

@Injectable()
export class MovieValidator {
  validateAndTransformOmdbMovieData(
    omdbMovie: OmdbMovieDTO,
  ): ValidatedMovieData {
    const requiredFields = [
      { field: omdbMovie.imdbID, name: 'imdbID' },
      { field: omdbMovie.Title, name: 'Title' },
      { field: omdbMovie.Plot, name: 'Plot' },
      { field: omdbMovie.Poster, name: 'Poster' },
    ];

    const missingFields = requiredFields
      .filter(({ field }) => !field || field === 'N/A')
      .map(({ name }) => name);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required movie data from OMDB: ${missingFields.join(', ')}`,
      );
    }

    return {
      imdbId: omdbMovie.imdbID,
      title: omdbMovie.Title,
      description: omdbMovie.Plot,
      posterUrl: omdbMovie.Poster,
      runtimeInMinuts: this.parseRuntime(omdbMovie.Runtime),
      genres: this.parseGenres(omdbMovie.Genre),
    };
  }

  private parseRuntime(runtime: string): number {
    if (!runtime || runtime === 'N/A') return 0;
    const match = runtime.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseGenres(genre: string): string[] {
    if (!genre || genre === 'N/A') return [];
    return genre.split(',').map((g) => g.trim());
  }
}
