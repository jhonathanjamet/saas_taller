import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';

@ApiTags('work-orders-public')
@Controller('public/work-orders')
export class WorkOrdersPublicController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Get(':orderNumber')
  getPublic(@Param('orderNumber') orderNumber: string) {
    return this.workOrders.getPublicByOrderNumber(orderNumber);
  }
}

