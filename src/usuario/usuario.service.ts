import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { handleError } from 'src/utils/handle.error.utils';

@Injectable()
export class UsuarioService {
  private usuarioSelect = {
    id: true,
    nickname: true,
    email: true,
    password: false,
    createdAt: true,
    updatedAt: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      select: this.usuarioSelect,
    });
  }

  async findById(id: string): Promise<Usuario> {
    const record = await this.prisma.usuario.findUnique({
      where: { id },
      select: this.usuarioSelect,
    });

    if (!record) {
      throw new NotFoundException(`Registro com o ID '${id}' não encontrado.`);
    }

    return record;
  }

  async findOne(id: string): Promise<Usuario> {
    return this.findById(id);
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    if (dto.password != dto.confirmPassword) {
      throw new BadRequestException('As senhas informadas não são iguais.');
    }

    delete dto.confirmPassword;

    const data: Usuario = {
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    };

    return this.prisma.usuario
      .create({
        data,
        select: this.usuarioSelect,
      })
      .catch(handleError);
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    await this.findById(id);

    if (dto.password) {
      if (dto.password != dto.confirmPassword) {
        throw new BadRequestException('As senhas informadas não são iguais.');
      }
    }

    delete dto.confirmPassword;

    const data: Partial<Usuario> = { ...dto };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.usuario
      .update({
        where: { id },
        data,
        select: this.usuarioSelect,
      })
      .catch(handleError);
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.usuario.delete({ where: { id } });
  }
}
