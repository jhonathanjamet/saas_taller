import { Module } from '@nestjs/common';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersPublicController } from './work-orders-public.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  controllers: [WorkOrdersController, WorkOrdersPublicController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}
