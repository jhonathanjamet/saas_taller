import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const role = await this.prisma.role.findFirst({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isSystem: false,
      },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.prisma.role.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.role.deleteMany({ where: { id, isSystem: false } });
    return { id };
  }

  async listPermissions(roleId: string) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
  }

  async setPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      });
    }
    return this.listPermissions(roleId);
  }
}
