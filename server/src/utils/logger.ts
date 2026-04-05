// server/src/utils/logger.ts
// Logger Winston avec format console coloré (dev) et JSON (prod)

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Format console coloré pour le développement
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, context, ...meta }) => {
    const ctx = context ? `[${context}]` : '';
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${ctx} ${message}${extra}`;
  })
);

// Format JSON structuré pour la production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  defaultMeta: { service: 'cgi-242' },
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

/**
 * Logger avec contexte, compatible avec l'API utilisée dans tout le projet
 */
class Logger {
  private winstonChild: winston.Logger;

  constructor(context?: string) {
    this.winstonChild = context ? winstonLogger.child({ context }) : winstonLogger;
  }

  debug(message: string, data?: unknown): void {
    if (data !== undefined) {
      this.winstonChild.debug(message, { data });
    } else {
      this.winstonChild.debug(message);
    }
  }

  info(message: string, data?: unknown): void {
    if (data !== undefined) {
      this.winstonChild.info(message, { data });
    } else {
      this.winstonChild.info(message);
    }
  }

  warn(message: string, data?: unknown): void {
    if (data !== undefined) {
      this.winstonChild.warn(message, { data });
    } else {
      this.winstonChild.warn(message);
    }
  }

  error(message: string, data?: unknown): void {
    if (data instanceof Error) {
      this.winstonChild.error(message, { error: data.message, stack: data.stack });
    } else if (data !== undefined) {
      this.winstonChild.error(message, { data });
    } else {
      this.winstonChild.error(message);
    }
  }

  child(context: string): Logger {
    return new Logger(context);
  }
}

export const logger = new Logger();

export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Singleton cache pour éviter de recréer des loggers identiques
const loggerCache = new Map<string, Logger>();

export function getLogger(context: string): Logger {
  if (!loggerCache.has(context)) {
    loggerCache.set(context, createLogger(context));
  }
  return loggerCache.get(context)!;
}

export default logger;
