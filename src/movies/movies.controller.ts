import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDTO } from './dto/create-movie.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetCurrentUser } from 'src/auth/decorators/get-current-user.decorator';
import type { User } from 'generated/prisma/client';
import { UpdateMovieDTO } from './dto/update-movie.dto';

@Controller('/movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMovie(
    @GetCurrentUser() user: User,
    @Body() createMovieDto: CreateMovieDTO,
  ) {
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'Current user is not allowed to perform this action.',
      );
    }

    return await this.moviesService.createMovie(createMovieDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateMovie(
    @GetCurrentUser() user: User,
    @Body() updateMovieDto: UpdateMovieDTO,
    @Param('id') id: string,
  ) {
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'Current user is not allowed to perform this action.',
      );
    }

    return await this.moviesService.updateMovie(id, updateMovieDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMovie(@GetCurrentUser() user: User, @Param('id') id: string) {
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'Current user is not allowed to perform this action.',
      );
    }

    return await this.moviesService.deleteMovie(id);
  }

  @Get()
  async getMovies() {
    return await this.moviesService.getMovies();
  }
}
