import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  tenantId?: string;
  userId?: string;
};

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextStore>();

  run(store: RequestContextStore, cb: () => void) {
    this.als.run(store, cb);
  }

  getTenantId(): string | undefined {
    return this.als.getStore()?.tenantId;
  }

  setTenantId(tenantId: string) {
    const store = this.als.getStore();
    if (store) store.tenantId = tenantId;
  }

  getUserId(): string | undefined {
    return this.als.getStore()?.userId;
  }

  setUserId(userId: string) {
    const store = this.als.getStore();
    if (store) store.userId = userId;
  }
}
