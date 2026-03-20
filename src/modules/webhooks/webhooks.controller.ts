import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  @RequirePermission('integrations:read')
  list() {
    return this.webhooks.list();
  }

  @Get(':id')
  @RequirePermission('integrations:read')
  get(@Param('id') id: string) {
    return this.webhooks.get(id);
  }

  @Post()
  @RequirePermission('integrations:configure')
  create(@Body() dto: CreateWebhookDto) {
    return this.webhooks.create(dto);
  }

  @Patch(':id')
  @RequirePermission('integrations:configure')
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooks.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('integrations:configure')
  remove(@Param('id') id: string) {
    return this.webhooks.remove(id);
  }
}
