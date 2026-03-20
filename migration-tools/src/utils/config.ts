import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface MigrationConfig {
  databaseUrl: string;
  tenantId: string;
  branchId: string;
  migrationUserId: string;
  csvDir: string;
  dryRun: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export function loadConfig(): MigrationConfig {
  const config: MigrationConfig = {
    databaseUrl: process.env.DATABASE_URL || '',
    tenantId: process.env.TENANT_ID || '',
    branchId: process.env.BRANCH_ID || '',
    migrationUserId: process.env.MIGRATION_USER_ID || '',
    csvDir: process.env.CSV_DIR || path.join(__dirname, '../../samples'),
    dryRun: process.env.DRY_RUN === 'true',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  };

  // Validaciones de config obligatoria
  const missing: string[] = [];
  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.tenantId) missing.push('TENANT_ID');
  if (!config.branchId) missing.push('BRANCH_ID');
  if (!config.migrationUserId) missing.push('MIGRATION_USER_ID');

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}\n` +
      'Copia .env.example a .env y completa los valores.'
    );
  }

  return config;
}

/**
 * Parsea los argumentos de l\u00ednea de comandos.
 */
export function parseArgs(): {
  entity?: string;
  dryRun: boolean;
  validateOnly: boolean;
} {
  const args = process.argv.slice(2);
  let entity: string | undefined;
  let dryRun = false;
  let validateOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--entity' && args[i + 1]) {
      entity = args[i + 1];
      i++;
    }
    if (args[i] === '--dry-run') dryRun = true;
    if (args[i] === '--validate-only') validateOnly = true;
  }

  return { entity, dryRun, validateOnly };
}
