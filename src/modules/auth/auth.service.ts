import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infra/prisma/prisma.service';

type Tokens = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, tenantId?: string): Promise<Tokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    if (user.tenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { id: user.tenantId, status: 'active' },
      });
      if (!tenant) throw new ForbiddenException('Tenant no activo');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.roleId, user.tenantId);

    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.updateMany({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    return tokens;
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    const payload = await this.jwt.verifyAsync(refreshToken, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
    });

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
    });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Refresh inválido');

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException('Refresh inválido');

    const tokens = await this.issueTokens(user.id, user.email, user.roleId, user.tenantId);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.user.updateMany({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    return tokens;
  }

  private async issueTokens(userId: string, email: string, roleId: string, tenantId?: string | null): Promise<Tokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, roleId, tenantId },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret',
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') || '15m',
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, roleId, tenantId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES') || '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
