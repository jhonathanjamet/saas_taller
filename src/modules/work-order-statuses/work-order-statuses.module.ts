import { Module } from '@nestjs/common';
import { WorkOrderStatusesController } from './work-order-statuses.controller';
import { WorkOrderStatusesService } from './work-order-statuses.service';

@Module({
  controllers: [WorkOrderStatusesController],
  providers: [WorkOrderStatusesService],
})
export class WorkOrderStatusesModule {}
