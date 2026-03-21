import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { CreateWorkOrderCommentDto } from './dto/create-work-order-comment.dto';
import { UpdateWorkOrderCommentDto } from './dto/update-work-order-comment.dto';
import { CreateWorkOrderTaskDto } from './dto/create-work-order-task.dto';
import { UpdateWorkOrderTaskDto } from './dto/update-work-order-task.dto';
import { CreateWorkOrderItemDto } from './dto/create-work-order-item.dto';
import { UpdateWorkOrderItemDto } from './dto/update-work-order-item.dto';

@ApiTags('work-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Get()
  @RequirePermission('work_orders:read')
  list() {
    return this.workOrders.list();
  }

  @Get('history')
  @RequirePermission('work_orders:read')
  history() {
    return this.workOrders.history();
  }

  @Post(':id/deliver')
  @RequirePermission('work_orders:update')
  deliver(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.workOrders.deliver(id, {
      userId: user?.id,
      tenantId: user?.tenantId,
    });
  }

  @Get(':id')
  @RequirePermission('work_orders:read')
  get(@Param('id') id: string) {
    return this.workOrders.get(id);
  }

  @Get(':id/comments')
  @RequirePermission('work_orders:read')
  comments(@Param('id') id: string) {
    return this.workOrders.comments(id);
  }

  @Post(':id/comments')
  @RequirePermission('work_orders:update')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateWorkOrderCommentDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.workOrders.addComment(id, dto, {
      userId: user?.id,
      tenantId: user?.tenantId,
    });
  }

  @Patch(':id/comments/:commentId')
  @RequirePermission('work_orders:update')
  updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateWorkOrderCommentDto,
  ) {
    return this.workOrders.updateComment(id, commentId, dto);
  }

  @Delete(':id/comments/:commentId')
  @RequirePermission('work_orders:update')
  removeComment(@Param('id') id: string, @Param('commentId') commentId: string) {
    return this.workOrders.removeComment(id, commentId);
  }

  @Get(':id/tasks')
  @RequirePermission('work_orders:read')
  tasks(@Param('id') id: string) {
    return this.workOrders.tasks(id);
  }

  @Post(':id/tasks')
  @RequirePermission('work_orders:update')
  addTask(
    @Param('id') id: string,
    @Body() dto: CreateWorkOrderTaskDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.workOrders.addTask(id, dto, { tenantId: user?.tenantId });
  }

  @Patch(':id/tasks/:taskId')
  @RequirePermission('work_orders:update')
  updateTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateWorkOrderTaskDto,
  ) {
    return this.workOrders.updateTask(id, taskId, dto);
  }

  @Delete(':id/tasks/:taskId')
  @RequirePermission('work_orders:update')
  removeTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.workOrders.removeTask(id, taskId);
  }

  @Get(':id/items')
  @RequirePermission('work_orders:read')
  items(@Param('id') id: string) {
    return this.workOrders.items(id);
  }

  @Post(':id/items')
  @RequirePermission('work_orders:update')
  addItem(
    @Param('id') id: string,
    @Body() dto: CreateWorkOrderItemDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.workOrders.addItem(id, dto, {
      userId: user?.id,
      tenantId: user?.tenantId,
    });
  }

  @Patch(':id/items/:itemId')
  @RequirePermission('work_orders:update')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateWorkOrderItemDto,
  ) {
    return this.workOrders.updateItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @RequirePermission('work_orders:update')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.workOrders.removeItem(id, itemId);
  }

  @Post()
  @RequirePermission('work_orders:create')
  create(@Body() dto: CreateWorkOrderDto, @CurrentUser() user?: AuthUser) {
    return this.workOrders.create(dto, { tenantId: user?.tenantId });
  }

  @Patch(':id')
  @RequirePermission('work_orders:update')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrders.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('work_orders:delete')
  remove(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.workOrders.remove(id, {
      userId: user?.id,
      tenantId: user?.tenantId,
    });
  }
}
