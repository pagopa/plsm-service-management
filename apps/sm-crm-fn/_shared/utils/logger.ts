// =============================================================================
// STRUCTURED LOGGER - Sistema di logging strutturato per Azure Functions
// =============================================================================

import type { InvocationContext } from "@azure/functions";

/**
 * Livelli di log supportati
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Metadata opzionali per arricchire i log
 */
export interface LogMetadata {
  /** ID della richiesta (per correlare log multipli) */
  requestId?: string;
  /** ID dell'utente o entità */
  userId?: string;
  /** ID dell'account/ente */
  accountId?: string;
  /** ID del contatto */
  contactId?: string;
  /** Email del contatto */
  email?: string;
  /** ID dell'appuntamento */
  activityId?: string;
  /** Prodotto Selfcare */
  productId?: string;
  /** Institution ID Selfcare */
  institutionId?: string;
  /** Durata operazione in ms */
  duration?: number;
  /** URL chiamata HTTP */
  url?: string;
  /** Status code HTTP */
  statusCode?: number;
  /** Metodo HTTP */
  method?: string;
  /** Filtro OData applicato */
  odataFilter?: string;
  /** Numero risultati query */
  resultCount?: number;
  /** Flag dry-run */
  dryRun?: boolean;
  /** Dati aggiuntivi custom */
  [key: string]: unknown;
}

/**
 * Struttura log per Azure Application Insights
 */
interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Logger configurabile con supporto per InvocationContext di Azure Functions
 */
export class Logger {
  private context?: InvocationContext;
  private defaultMetadata: LogMetadata;

  constructor(context?: InvocationContext, defaultMetadata: LogMetadata = {}) {
    this.context = context;
    this.defaultMetadata = defaultMetadata;
  }

  /**
   * Crea un nuovo logger child con metadata aggiuntivi
   */
  child(additionalMetadata: LogMetadata): Logger {
    return new Logger(this.context, {
      ...this.defaultMetadata,
      ...additionalMetadata,
    });
  }

  /**
   * Log di debug (solo in dev o se DEBUG=true)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (
      process.env.DEBUG === "true" ||
      process.env.NODE_ENV === "development"
    ) {
      this.log(LogLevel.DEBUG, message, metadata);
    }
  }

  /**
   * Log informativo (operazioni normali)
   */
  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log di warning (situazioni anomale ma gestibili)
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log di errore (errori bloccanti)
   */
  error(
    message: string,
    error?: Error | unknown,
    metadata?: LogMetadata,
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, metadata, errorObj);
  }

  /**
   * Log strutturato principale
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error,
  ): void {
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: {
        ...this.defaultMetadata,
        ...metadata,
      },
    };

    if (error) {
      structuredLog.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Formatta output per Azure Function App Logs
    const logMessage = this.formatForAzure(structuredLog);

    // Usa il logger di Azure Functions se disponibile
    if (this.context) {
      switch (level) {
        case LogLevel.DEBUG:
          this.context.debug?.(logMessage) ?? this.context.log(logMessage);
          break;
        case LogLevel.INFO:
          this.context.log(logMessage);
          break;
        case LogLevel.WARN:
          this.context.warn(logMessage);
          break;
        case LogLevel.ERROR:
          this.context.error(logMessage);
          if (error?.stack) {
            this.context.error(error.stack);
          }
          break;
      }
    } else {
      // Fallback su console
      const consoleMethod =
        level === LogLevel.ERROR ? console.error : console.log;
      consoleMethod(logMessage);
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  }

  /**
   * Formatta il log per Azure con prefisso e metadata JSON
   */
  private formatForAzure(log: StructuredLog): string {
    const emoji = this.getEmoji(log.level);
    const metadataStr =
      log.metadata && Object.keys(log.metadata).length > 0
        ? ` | ${JSON.stringify(log.metadata)}`
        : "";

    return `${emoji} [${log.level}] ${log.message}${metadataStr}`;
  }

  /**
   * Emoji per livello di log (facilita visual scanning nei log stream)
   */
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "🔍";
      case LogLevel.INFO:
        return "ℹ️";
      case LogLevel.WARN:
        return "⚠️";
      case LogLevel.ERROR:
        return "❌";
      default:
        return "📋";
    }
  }
}

/**
 * Utility per loggare operazioni HTTP verso Dynamics
 */
export function logHttpRequest(
  logger: Logger,
  method: string,
  url: string,
  metadata?: LogMetadata,
): void {
  // Redigi token e dati sensibili dall'URL
  const sanitizedUrl = sanitizeUrl(url);

  logger.info(`HTTP ${method} → ${sanitizedUrl}`, {
    method,
    url: sanitizedUrl,
    ...metadata,
  });
}

/**
 * Utility per loggare risposte HTTP
 */
export function logHttpResponse(
  logger: Logger,
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  resultCount?: number,
  metadata?: LogMetadata,
): void {
  const sanitizedUrl = sanitizeUrl(url);
  const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;

  const message = `HTTP ${method} ← ${statusCode} (${duration}ms)${resultCount !== undefined ? ` - ${resultCount} results` : ""}`;

  if (level === LogLevel.ERROR) {
    logger.error(message, undefined, {
      method,
      url: sanitizedUrl,
      statusCode,
      duration,
      resultCount,
      ...metadata,
    });
  } else {
    logger.info(message, {
      method,
      url: sanitizedUrl,
      statusCode,
      duration,
      resultCount,
      ...metadata,
    });
  }
}

/**
 * Utility per loggare query OData
 */
export function logODataQuery(
  logger: Logger,
  endpoint: string,
  filter?: string,
  select?: string,
  top?: string,
  metadata?: LogMetadata,
): void {
  logger.debug(`OData Query: ${endpoint}`, {
    endpoint,
    odataFilter: filter,
    odataSelect: select,
    odataTop: top,
    ...metadata,
  });
}

/**
 * Sanitizza URL rimuovendo token e dati sensibili
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Lista di parametri sensibili da rimuovere
    const sensitiveParams = [
      "access_token",
      "token",
      "api-key",
      "apikey",
      "api_key",
      "authorization",
      "auth",
      "password",
      "secret",
      "client_secret",
    ];

    // Rimuovi solo parametri sensibili, mantieni OData params ($filter, $select, etc.)
    const searchParams = new URLSearchParams(urlObj.search);
    for (const param of sensitiveParams) {
      searchParams.delete(param);
    }

    const queryString = searchParams.toString();
    const path = `${urlObj.hostname}${urlObj.pathname}`;

    return queryString ? `${path}?${queryString}` : path;
  } catch {
    // Se non è un URL valido, ritorna così com'è
    return url;
  }
}

/**
 * Crea un logger per una funzione Azure
 */
export function createLogger(
  context?: InvocationContext,
  defaultMetadata?: LogMetadata,
): Logger {
  return new Logger(context, defaultMetadata);
}

/**
 * Timer per misurare durata operazioni
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Ritorna durata in millisecondi dall'inizio
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Logga durata operazione
   */
  logElapsed(logger: Logger, operation: string, metadata?: LogMetadata): void {
    const duration = this.elapsed();
    logger.info(`${operation} completed in ${duration}ms`, {
      duration,
      operation,
      ...metadata,
    });
  }
}
