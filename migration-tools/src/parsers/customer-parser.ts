import { v4 as uuidv4 } from 'uuid';
import { readCsv, cleanString, parseBool } from '../utils/csv-reader';
import { CustomerRow, validateCustomer } from '../validators';
import { MigrationLogger } from '../utils/logger';

export interface ParsedCustomer {
  id: string;
  tenantId: string;
  type: 'person' | 'company';
  firstName: string;
  lastName: string | null;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  source: string;
  isActive: boolean;
  createdBy: string | null;
}

function mapType(tipo: string | undefined): 'person' | 'company' {
  if (!tipo) return 'person';
  const t = tipo.trim().toLowerCase();
  if (['empresa', 'company', 'juridica'].includes(t)) return 'company';
  return 'person';
}

export function parseCustomers(
  filePath: string,
  tenantId: string,
  userId: string,
  logger: MigrationLogger
): ParsedCustomer[] {
  logger.info(`Leyendo archivo de clientes: ${filePath}`);
  const rows = readCsv<CustomerRow>(filePath);
  logger.info(`${rows.length} filas encontradas en CSV`);

  const results: ParsedCustomer[] = [];
  const seenEmails = new Set<string>();
  const seenRuts = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 por header y 0-based

    // Validar
    const errors = validateCustomer(row, rowNum);
    if (errors.length > 0) {
      errors.forEach((e) => logger.error(e.message, rowNum, row));
      logger.recordError();
      continue;
    }

    // Detectar duplicados por email
    const email = cleanString(row.email);
    if (email) {
      const emailLower = email.toLowerCase();
      if (seenEmails.has(emailLower)) {
        logger.recordSkipped(`Fila ${rowNum}: Email duplicado ${email}`);
        continue;
      }
      seenEmails.add(emailLower);
    }

    // Detectar duplicados por RUT
    const taxId = cleanString(row.rut);
    if (taxId) {
      if (seenRuts.has(taxId)) {
        logger.recordSkipped(`Fila ${rowNum}: RUT duplicado ${taxId}`);
        continue;
      }
      seenRuts.add(taxId);
    }

    results.push({
      id: uuidv4(),
      tenantId,
      type: mapType(row.tipo),
      firstName: row.nombre!.trim(),
      lastName: cleanString(row.apellido),
      legalName: cleanString(row.razon_social),
      taxId,
      email,
      phone: cleanString(row.telefono),
      secondaryPhone: cleanString(row.telefono2),
      address: cleanString(row.direccion),
      city: cleanString(row.ciudad),
      state: cleanString(row.region),
      notes: cleanString(row.notas),
      source: 'migracion_gestioo',
      isActive: true,
      createdBy: userId,
    });

    logger.recordImported();
  }

  return results;
}
