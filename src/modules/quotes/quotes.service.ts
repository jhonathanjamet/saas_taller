import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RequestContextService } from '../../common/request-context/request-context.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService,
  ) {}

  list() {
    return this.prisma.quote.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    return quote;
  }

  create(dto: CreateQuoteDto) {
    const tenantId = this.context.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant requerido');
    return this.prisma.quote.create({ data: { ...dto, tenantId } as any });
  }

  async update(id: string, dto: UpdateQuoteDto) {
    await this.prisma.quote.updateMany({ where: { id }, data: dto });
    return this.get(id);
  }

  async remove(id: string) {
    await this.prisma.quote.updateMany({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
}
