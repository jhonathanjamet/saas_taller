import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Get()
  list() {
    return this.branches.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.branches.get(id);
  }

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branches.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branches.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branches.remove(id);
  }
}
