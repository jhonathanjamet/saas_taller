import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { TenantsService } from './tenants.service';
import { UpdateWorkshopConfigDto } from './dto/update-workshop-config.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.tenants.getTenant(user.tenantId || undefined);
  }

  @Get('workshop-config')
  getWorkshopConfig(@CurrentUser() user: AuthUser) {
    return this.tenants.getWorkshopConfig(user.tenantId || undefined);
  }

  @Put('workshop-config')
  updateWorkshopConfig(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateWorkshopConfigDto,
  ) {
    return this.tenants.updateWorkshopConfig(user.tenantId || undefined, dto);
  }
}
