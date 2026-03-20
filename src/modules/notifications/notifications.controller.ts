import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('templates')
  @RequirePermission('notifications:read')
  templates() {
    return this.notifications.templates();
  }

  @Get('logs')
  @RequirePermission('notifications:read')
  logs() {
    return this.notifications.logs();
  }

  @Post('logs')
  @RequirePermission('notifications:send')
  createLog(@Body() dto: CreateNotificationLogDto) {
    return this.notifications.createLog(dto);
  }
}
