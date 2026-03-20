import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { AuthUser } from '../../common/types/auth-user';

type JwtPayload = {
  sub: string;
  tenantId?: string | null;
  roleId: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly context: RequestContextService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    const user: AuthUser = {
      id: payload.sub,
      tenantId: payload.tenantId,
      roleId: payload.roleId,
      email: payload.email,
    };
    this.context.setUserId(user.id);
    if (payload.tenantId) this.context.setTenantId(payload.tenantId);
    return user;
  }
}
