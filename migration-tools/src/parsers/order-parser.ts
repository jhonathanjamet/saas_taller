import { v4 as uuidv4 } from 'uuid';
import { readCsv, cleanString, parseDecimal, parseDate } from '../utils/csv-reader';
import { OrderRow, validateOrder } from '../validators';
import { MigrationLogger } from '../utils/logger';

export interface ParsedOrder {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: string;
  _clienteRut: string | null;
  _clienteEmail: string | null;
  _clienteNombre: string | null;
  _activoSerial: string | null;
  _activoPatente: string | null;
  _estadoCodigo: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderType: string | null;
  initialDiagnosis: string | null;
  technicalDiagnosis: string | null;
  internalNotes: string | null;
  clientNotes: string | null;
  receivedAt: Date | null;
  promisedAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
  subtotalProducts: number;
  subtotalServices: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  createdBy: string | null;
}

function mapPriority(value: string | undefined): 'low' | 'medium' | 'high' | 'urgent' {
  if (!value) return 'medium';
  const v = value.trim().toLowerCase();
  const map: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    baja: 'low', low: 'low',
    media: 'medium', medium: 'medium', normal: 'medium',
    alta: 'high', high: 'high',
    urgente: 'urgent', urgent: 'urgent',
  };
  return map[v] || 'medium';
}

export function parseOrders(
  filePath: string,
  tenantId: string,
  branchId: string,
  userId: string,
  logger: MigrationLogger
): ParsedOrder[] {
  logger.info(`Leyendo archivo de \u00f3rdenes: ${filePath}`);
  const rows = readCsv<OrderRow>(filePath);
  logger.info(`${rows.length} filas encontradas en CSV`);

  const results: ParsedOrder[] = [];
  const seenOrderNumbers = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const errors = validateOrder(row, rowNum);
    if (errors.length > 0) {
      errors.forEach((e) => logger.error(e.message, rowNum, row));
      logger.recordError();
      continue;
    }

    const orderNumber = row.numero_orden!.trim();

    // Detectar duplicados
    if (seenOrderNumbers.has(orderNumber)) {
      logger.recordSkipped(`Fila ${rowNum}: N\u00famero de orden duplicado ${orderNumber}`);
      continue;
    }
    seenOrderNumbers.add(orderNumber);

    results.push({
      id: uuidv4(),
      tenantId,
      branchId,
      orderNumber,
      _clienteRut: cleanString(row.cliente_rut),
      _clienteEmail: cleanString(row.cliente_email),
      _clienteNombre: cleanString(row.cliente_nombre),
      _activoSerial: cleanString(row.activo_serial),
      _activoPatente: cleanString(row.activo_patente),
      _estadoCodigo: cleanString(row.estado),
      priority: mapPriority(row.prioridad),
      orderType: cleanString(row.tipo),
      initialDiagnosis: cleanString(row.diagnostico_inicial),
      technicalDiagnosis: cleanString(row.diagnostico_tecnico),
      internalNotes: cleanString(row.notas_internas),
      clientNotes: cleanString(row.notas_cliente),
      receivedAt: parseDate(row.fecha_ingreso),
      promisedAt: parseDate(row.fecha_prometida),
      completedAt: parseDate(row.fecha_completado),
      deliveredAt: parseDate(row.fecha_entrega),
      subtotalProducts: parseDecimal(row.subtotal_productos),
      subtotalServices: parseDecimal(row.subtotal_servicios),
      discountAmount: parseDecimal(row.descuento),
      taxAmount: parseDecimal(row.impuesto),
      totalAmount: parseDecimal(row.total),
      createdBy: userId,
    });

    logger.recordImported();
  }

  return results;
}
