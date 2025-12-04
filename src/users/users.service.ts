import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDTO): Promise<User> {
    let user: User;

    try {
      user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: await bcrypt.hash(createUserDto.password, 10),
        },
      });
    } catch (error) {
      // eslint-disable-next-line
      if (error.code === 'P2002' && error.meta.target === 'email') {
        throw new ConflictException('Email already in use.');
      }

      throw new InternalServerErrorException(
        'Something went wrong, please try again later.',
      );
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
