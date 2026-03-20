import { v4 as uuidv4 } from 'uuid';
import { readCsv, cleanString, parseDecimal } from '../utils/csv-reader';
import { ProductRow, validateProduct } from '../validators';
import { MigrationLogger } from '../utils/logger';

export interface ParsedProduct {
  id: string;
  tenantId: string;
  _categoriaNombre: string | null;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  unit: string;
  cost: number;
  price: number;
  wholesalePrice: number | null;
  taxRate: number;
  minStock: number;
  _stockActual: number;
  location: string | null;
  isActive: boolean;
}

export function parseProducts(
  filePath: string,
  tenantId: string,
  logger: MigrationLogger
): ParsedProduct[] {
  logger.info(`Leyendo archivo de productos: ${filePath}`);
  const rows = readCsv<ProductRow>(filePath);
  logger.info(`${rows.length} filas encontradas en CSV`);

  const results: ParsedProduct[] = [];
  const seenSkus = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const errors = validateProduct(row, rowNum);
    if (errors.length > 0) {
      errors.forEach((e) => logger.error(e.message, rowNum, row));
      logger.recordError();
      continue;
    }

    // Detectar duplicados por SKU
    const sku = cleanString(row.sku);
    if (sku) {
      if (seenSkus.has(sku.toUpperCase())) {
        logger.recordSkipped(`Fila ${rowNum}: SKU duplicado ${sku}`);
        continue;
      }
      seenSkus.add(sku.toUpperCase());
    }

    const unit = cleanString(row.unidad) || 'unidad';

    results.push({
      id: uuidv4(),
      tenantId,
      _categoriaNombre: cleanString(row.categoria),
      sku,
      barcode: cleanString(row.codigo_barras),
      name: row.nombre!.trim(),
      description: cleanString(row.descripcion),
      unit,
      cost: parseDecimal(row.costo),
      price: parseDecimal(row.precio),
      wholesalePrice: row.precio_mayorista ? parseDecimal(row.precio_mayorista) : null,
      taxRate: row.impuesto ? parseDecimal(row.impuesto) : 19, // IVA Chile por defecto
      minStock: parseDecimal(row.stock_minimo),
      _stockActual: parseDecimal(row.stock_actual),
      location: cleanString(row.ubicacion),
      isActive: true,
    });

    logger.recordImported();
  }

  return results;
}
