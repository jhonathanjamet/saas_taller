import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWorkshopConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoTaller?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proximaOrden?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenciaExterna?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoEquipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solicitarFirma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  solicitarEncuesta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoEncuesta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textoLibre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correoCliente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefonoCliente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eliminacionOrdenes?: string;
}

