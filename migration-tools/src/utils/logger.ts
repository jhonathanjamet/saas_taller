import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class MigrationLogger {
  private logFile: string;
  private errorFile: string;
  private level: LogLevel;
  private logStream: fs.WriteStream;
  private errorStream: fs.WriteStream;

  // Contadores
  public stats = {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  constructor(entity: string, level: LogLevel = 'info') {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `${entity}_${timestamp}.log`);
    this.errorFile = path.join(logsDir, `${entity}_${timestamp}_errors.log`);
    this.level = level;

    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.errorStream = fs.createWriteStream(this.errorFile, { flags: 'a' });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      this.logStream.write(formatted + '\n');
    }
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      console.log(formatted);
      this.logStream.write(formatted + '\n');
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      console.warn(formatted);
      this.logStream.write(formatted + '\n');
    }
  }

  error(message: string, row?: number, data?: any): void {
    const formatted = this.formatMessage('error', message);
    console.error(formatted);
    this.logStream.write(formatted + '\n');
    
    const errorDetail = row !== undefined
      ? `${formatted} | Fila: ${row} | Datos: ${JSON.stringify(data || {})}`
      : formatted;
    this.errorStream.write(errorDetail + '\n');
    this.stats.errors++;
  }

  recordImported(): void {
    this.stats.imported++;
    this.stats.total++;
  }

  recordSkipped(reason: string): void {
    this.stats.skipped++;
    this.stats.total++;
    this.debug(`Registro omitido: ${reason}`);
  }

  recordError(): void {
    this.stats.total++;
  }

  printSummary(): void {
    const summary = `
====================================
  RESUMEN DE MIGRACI\u00d3N
====================================
  Total procesados: ${this.stats.total}
  Importados OK:    ${this.stats.imported}
  Omitidos:         ${this.stats.skipped}
  Errores:          ${this.stats.errors}
====================================
  Log completo:     ${this.logFile}
  Log de errores:   ${this.errorFile}
====================================`;
    console.log(summary);
    this.logStream.write(summary + '\n');
  }

  close(): void {
    this.logStream.end();
    this.errorStream.end();
  }
}
