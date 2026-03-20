import { v4 as uuidv4 } from 'uuid';
import { readCsv, cleanString, parseDecimal, parseInt2 } from '../utils/csv-reader';
import { AssetRow, validateAsset } from '../validators';
import { MigrationLogger } from '../utils/logger';

export interface ParsedAsset {
  id: string;
  tenantId: string;
  // Para resolver la referencia al cliente despu\u00e9s
  _clienteRut: string | null;
  _clienteEmail: string | null;
  _clienteNombre: string | null;
  _tipoActivo: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  licensePlate: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  accessories: string | null;
  visualCondition: string | null;
  notes: string | null;
  isActive: boolean;
  createdBy: string | null;
}

export function parseAssets(
  filePath: string,
  tenantId: string,
  userId: string,
  logger: MigrationLogger
): ParsedAsset[] {
  logger.info(`Leyendo archivo de activos: ${filePath}`);
  const rows = readCsv<AssetRow>(filePath);
  logger.info(`${rows.length} filas encontradas en CSV`);

  const results: ParsedAsset[] = [];
  const seenSerials = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const errors = validateAsset(row, rowNum);
    if (errors.length > 0) {
      errors.forEach((e) => logger.error(e.message, rowNum, row));
      logger.recordError();
      continue;
    }

    // Detectar duplicados por serial
    const serial = cleanString(row.serial);
    if (serial) {
      if (seenSerials.has(serial.toUpperCase())) {
        logger.recordSkipped(`Fila ${rowNum}: Serial duplicado ${serial}`);
        continue;
      }
      seenSerials.add(serial.toUpperCase());
    }

    results.push({
      id: uuidv4(),
      tenantId,
      _clienteRut: cleanString(row.cliente_rut),
      _clienteEmail: cleanString(row.cliente_email),
      _clienteNombre: cleanString(row.cliente_nombre),
      _tipoActivo: cleanString(row.tipo),
      brand: cleanString(row.marca),
      model: cleanString(row.modelo),
      serialNumber: serial,
      licensePlate: cleanString(row.patente),
      year: parseInt2(row.anio),
      color: cleanString(row.color),
      mileage: row.kilometraje ? parseDecimal(row.kilometraje) : null,
      accessories: cleanString(row.accesorios),
      visualCondition: cleanString(row.condicion),
      notes: cleanString(row.notas),
      isActive: true,
      createdBy: userId,
    });

    logger.recordImported();
  }

  return results;
}
