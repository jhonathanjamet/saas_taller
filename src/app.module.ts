import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestContextMiddleware } from './common/request-context/request-context.middleware';
import { RequestContextModule } from './common/request-context/request-context.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AssetsModule } from './modules/assets/assets.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ServicesModule } from './modules/services/services.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { PreventiveModule } from './modules/preventive/preventive.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WorkOrderStatusesModule } from './modules/work-order-statuses/work-order-statuses.module';
import { FilesModule } from './modules/files/files.module';
import { S3ConfigModule } from './modules/integrations/s3/s3-config.module';
import { MessagingConfigModule } from './modules/integrations/messaging/messaging-config.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RequestContextModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    CustomersModule,
    AssetsModule,
    WorkOrdersModule,
    QuotesModule,
    ProductsModule,
    InventoryModule,
    ServicesModule,
    ReportsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SuppliersModule,
    PurchasesModule,
    PreventiveModule,
    NotificationsModule,
    WebhooksModule,
    WorkOrderStatusesModule,
    FilesModule,
    S3ConfigModule,
    MessagingConfigModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
