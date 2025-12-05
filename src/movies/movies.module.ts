import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { HttpModule } from '@nestjs/axios';
import { MovieValidator } from './validators/omdb-movie-validator';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [MoviesController],
  providers: [MoviesService, MovieValidator],
  exports: [MoviesService],
})
export class MoviesModule {}
