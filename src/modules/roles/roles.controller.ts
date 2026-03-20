import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequirePermission('admin:manage_roles')
  list() {
    return this.roles.list();
  }

  @Get(':id')
  @RequirePermission('admin:manage_roles')
  get(@Param('id') id: string) {
    return this.roles.get(id);
  }

  @Post()
  @RequirePermission('admin:manage_roles')
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @RequirePermission('admin:manage_roles')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('admin:manage_roles')
  remove(@Param('id') id: string) {
    return this.roles.remove(id);
  }

  @Get(':id/permissions')
  @RequirePermission('admin:manage_roles')
  listPermissions(@Param('id') id: string) {
    return this.roles.listPermissions(id);
  }

  @Patch(':id/permissions')
  @RequirePermission('admin:manage_roles')
  setPermissions(@Param('id') id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.roles.setPermissions(id, dto.permissionIds);
  }
}
