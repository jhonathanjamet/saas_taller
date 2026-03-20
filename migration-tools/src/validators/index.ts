/**
 * Validadores para datos de migración desde Gestioo.
 * Cada validador retorna un array de errores (vacío = válido).
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ─── Helpers ───────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Acepta formatos variados: +56912345678, 912345678, etc.
  return /^[\+]?[\d\s\-\(\)]{7,20}$/.test(phone);
}

function isValidRut(rut: string): boolean {
  // Formato chileno básico: 12.345.678-9 o 12345678-9
  return /^[\d]{1,3}(\.?\d{3})*-[\dkK]$/.test(rut.trim());
}

// ─── Customer Validator ────────────────────────────────────

export interface CustomerRow {
  nombre?: string;
  apellido?: string;
  razon_social?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  telefono2?: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  tipo?: string;
  notas?: string;
  [key: string]: string | undefined;
}

export function validateCustomer(row: CustomerRow, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Nombre es obligatorio
  if (!row.nombre || row.nombre.trim() === '') {
    errors.push({ field: 'nombre', message: `Fila ${rowNum}: Nombre es obligatorio` });
  }

  // Email válido si está presente
  if (row.email && row.email.trim() !== '' && !isValidEmail(row.email.trim())) {
    errors.push({ field: 'email', message: `Fila ${rowNum}: Email inválido`, value: row.email });
  }

  // Teléfono válido si está presente
  if (row.telefono && row.telefono.trim() !== '' && !isValidPhone(row.telefono.trim())) {
    errors.push({ field: 'telefono', message: `Fila ${rowNum}: Teléfono inválido`, value: row.telefono });
  }

  // RUT válido si está presente
  if (row.rut && row.rut.trim() !== '' && !isValidRut(row.rut.trim())) {
    errors.push({ field: 'rut', message: `Fila ${rowNum}: RUT con formato inválido`, value: row.rut });
  }

  // Tipo válido
  if (row.tipo && !['persona', 'empresa', 'person', 'company'].includes(row.tipo.trim().toLowerCase())) {
    errors.push({ field: 'tipo', message: `Fila ${rowNum}: Tipo debe ser 'persona' o 'empresa'`, value: row.tipo });
  }

  return errors;
}

// ─── Asset Validator ───────────────────────────────────────

export interface AssetRow {
  cliente_rut?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  patente?: string;
  anio?: string;
  color?: string;
  kilometraje?: string;
  accesorios?: string;
  condicion?: string;
  notas?: string;
  [key: string]: string | undefined;
}

export function validateAsset(row: AssetRow, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Debe tener algún identificador de cliente
  const hasClientRef = (row.cliente_rut && row.cliente_rut.trim() !== '') ||
    (row.cliente_email && row.cliente_email.trim() !== '') ||
    (row.cliente_nombre && row.cliente_nombre.trim() !== '');

  if (!hasClientRef) {
    errors.push({
      field: 'cliente',
      message: `Fila ${rowNum}: Se requiere al menos un identificador de cliente (rut, email o nombre)`,
    });
  }

  // Debe tener al menos marca o modelo o serial
  const hasIdentifier = (row.marca && row.marca.trim() !== '') ||
    (row.modelo && row.modelo.trim() !== '') ||
    (row.serial && row.serial.trim() !== '');

  if (!hasIdentifier) {
    errors.push({
      field: 'identificacion',
      message: `Fila ${rowNum}: Se requiere al menos marca, modelo o número de serie`,
    });
  }

  // Año válido si está presente
  if (row.anio && row.anio.trim() !== '') {
    const year = parseInt(row.anio.trim());
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      errors.push({ field: 'anio', message: `Fila ${rowNum}: Año inválido`, value: row.anio });
    }
  }

  return errors;
}

// ─── Product Validator ─────────────────────────────────────

export interface ProductRow {
  nombre?: string;
  sku?: string;
  codigo_barras?: string;
  descripcion?: string;
  categoria?: string;
  unidad?: string;
  costo?: string;
  precio?: string;
  precio_mayorista?: string;
  stock_minimo?: string;
  stock_actual?: string;
  ubicacion?: string;
  impuesto?: string;
  [key: string]: string | undefined;
}

export function validateProduct(row: ProductRow, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Nombre obligatorio
  if (!row.nombre || row.nombre.trim() === '') {
    errors.push({ field: 'nombre', message: `Fila ${rowNum}: Nombre del producto es obligatorio` });
  }

  // Precio debe ser numérico positivo si está presente
  if (row.precio && row.precio.trim() !== '') {
    const price = parseFloat(row.precio.replace(/\./g, '').replace(',', '.'));
    if (isNaN(price) || price < 0) {
      errors.push({ field: 'precio', message: `Fila ${rowNum}: Precio inválido`, value: row.precio });
    }
  }

  // Costo debe ser numérico positivo si está presente
  if (row.costo && row.costo.trim() !== '') {
    const cost = parseFloat(row.costo.replace(/\./g, '').replace(',', '.'));
    if (isNaN(cost) || cost < 0) {
      errors.push({ field: 'costo', message: `Fila ${rowNum}: Costo inválido`, value: row.costo });
    }
  }

  return errors;
}

// ─── Work Order Validator ──────────────────────────────────

export interface OrderRow {
  numero_orden?: string;
  cliente_rut?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  activo_serial?: string;
  activo_patente?: string;
  tipo?: string;
  prioridad?: string;
  estado?: string;
  diagnostico_inicial?: string;
  diagnostico_tecnico?: string;
  notas_internas?: string;
  notas_cliente?: string;
  fecha_ingreso?: string;
  fecha_prometida?: string;
  fecha_completado?: string;
  fecha_entrega?: string;
  subtotal_productos?: string;
  subtotal_servicios?: string;
  descuento?: string;
  impuesto?: string;
  total?: string;
  [key: string]: string | undefined;
}

export function validateOrder(row: OrderRow, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Número de orden obligatorio
  if (!row.numero_orden || row.numero_orden.trim() === '') {
    errors.push({ field: 'numero_orden', message: `Fila ${rowNum}: Número de orden es obligatorio` });
  }

  // Debe tener algún identificador de cliente
  const hasClientRef = (row.cliente_rut && row.cliente_rut.trim() !== '') ||
    (row.cliente_email && row.cliente_email.trim() !== '') ||
    (row.cliente_nombre && row.cliente_nombre.trim() !== '');

  if (!hasClientRef) {
    errors.push({
      field: 'cliente',
      message: `Fila ${rowNum}: Se requiere al menos un identificador de cliente`,
    });
  }

  // Prioridad válida si está presente
  if (row.prioridad && row.prioridad.trim() !== '') {
    const valid = ['baja', 'media', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent'];
    if (!valid.includes(row.prioridad.trim().toLowerCase())) {
      errors.push({ field: 'prioridad', message: `Fila ${rowNum}: Prioridad inválida`, value: row.prioridad });
    }
  }

  return errors;
}
