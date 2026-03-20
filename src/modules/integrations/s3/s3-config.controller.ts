import { Body, Controller, Get, Put, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { S3ConfigService } from './s3-config.service';
import { UpsertS3ConfigDto } from './dto/upsert-s3-config.dto';
import { TestS3ConfigDto } from './dto/test-s3-config.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('integrations/s3')
export class S3ConfigController {
  constructor(private readonly s3: S3ConfigService) {}

  @Get()
  @RequirePermission('integrations:read')
  get() {
    return this.s3.get();
  }

  @Put()
  @RequirePermission('integrations:configure')
  upsert(@Body() dto: UpsertS3ConfigDto) {
    return this.s3.upsert(dto);
  }

  @Post('test')
  @RequirePermission('integrations:configure')
  test(@Body() dto: TestS3ConfigDto) {
    return this.s3.test(dto);
  }
}
