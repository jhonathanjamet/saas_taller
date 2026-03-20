import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) throw new ForbiddenException('Usuario no autenticado');

    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: user.roleId,
        permission: {
          module: required.split(':')[0],
          action: required.split(':')[1],
        },
      },
      select: { id: true },
    });

    if (!permission) {
      throw new ForbiddenException('Permiso denegado');
    }

    return true;
  }
}
