import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RequestContextService } from '../../common/request-context/request-context.service';

const GLOBAL_MODELS = new Set([
  'SubscriptionPlan',
  'Permission',
]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly context: RequestContextService) {
    super();

    this.$use(async (params, next) => {
      const model = params.model ?? '';
      const tenantId = this.context.getTenantId();

      if (!tenantId || GLOBAL_MODELS.has(model)) {
        return next(params);
      }

      if (params.action === 'create') {
        params.args.data = { ...params.args.data, tenantId };
      }

      if (['findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
        params.args.where = { ...params.args.where, tenantId };
      }

      if (['updateMany', 'deleteMany'].includes(params.action)) {
        params.args.where = { ...params.args.where, tenantId };
      }

      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
