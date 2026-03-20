import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.header('x-tenant-id') || undefined;
    const userId = req.header('x-user-id') || undefined;

    this.context.run({ tenantId, userId }, () => next());
  }
}
