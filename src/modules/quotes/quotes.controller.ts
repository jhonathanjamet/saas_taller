import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@ApiTags('quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  @RequirePermission('quotes:read')
  list() {
    return this.quotes.list();
  }

  @Get(':id')
  @RequirePermission('quotes:read')
  get(@Param('id') id: string) {
    return this.quotes.get(id);
  }

  @Post()
  @RequirePermission('quotes:create')
  create(@Body() dto: CreateQuoteDto) {
    return this.quotes.create(dto);
  }

  @Patch(':id')
  @RequirePermission('quotes:update')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotes.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('quotes:delete')
  remove(@Param('id') id: string) {
    return this.quotes.remove(id);
  }
}
