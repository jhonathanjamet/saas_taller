import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

export interface CsvReadOptions {
  delimiter?: string;
  encoding?: BufferEncoding;
  skipEmptyLines?: boolean;
  columns?: boolean | string[];
}

/**
 * Lee un archivo CSV y retorna un array de objetos.
 * Por defecto usa la primera fila como nombres de columna.
 */
export function readCsv<T = Record<string, string>>(
  filePath: string,
  options: CsvReadOptions = {}
): T[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo CSV no encontrado: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, {
    encoding: options.encoding || 'utf-8',
  });

  const records = parse(content, {
    delimiter: options.delimiter || ',',
    columns: options.columns !== undefined ? options.columns : true,
    skip_empty_lines: options.skipEmptyLines !== false,
    trim: true,
    bom: true, // Manejar BOM de Excel
    relax_column_count: true,
  });

  return records as T[];
}

/**
 * Limpia y normaliza un valor de string del CSV.
 */
export function cleanString(value: string | undefined | null): string | null {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'null') {
    return null;
  }
  return value.trim();
}

/**
 * Parsea un n\u00famero decimal desde string.
 */
export function parseDecimal(value: string | undefined | null): number {
  if (!value || value.trim() === '') return 0;
  // Manejar formato con coma decimal (1.234,56 -> 1234.56)
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parsea un entero desde string.
 */
export function parseInt2(value: string | undefined | null): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? null : num;
}

/**
 * Parsea una fecha desde string (formatos comunes: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD).
 */
export function parseDate(value: string | undefined | null): Date | null {
  if (!value || value.trim() === '') return null;
  const v = value.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const match = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Parsea un boolean desde string.
 */
export function parseBool(value: string | undefined | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return ['true', '1', 'si', 's\u00ed', 'yes', 'y', 'activo', 'active'].includes(v);
}
