import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { WorkOrderStatusesService } from './work-order-statuses.service';

@ApiTags('work-order-statuses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('work-order-statuses')
export class WorkOrderStatusesController {
  constructor(private readonly statuses: WorkOrderStatusesService) {}

  @Get()
  @RequirePermission('work_orders:read')
  list(@CurrentUser() user?: AuthUser) {
    return this.statuses.list(user?.tenantId);
  }
}
