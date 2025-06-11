/**
 * Structured Logger
 *
 * Provides comprehensive logging with:
 * - JSON structured format
 * - Multiple log levels
 * - Correlation IDs for request tracking
 * - Security event logging
 * - Performance tracking
 * - Error aggregation
 */
import { ErrorContext } from '../../src';

export class StructuredLogger {
  private static instance: StructuredLogger
  private correlationId = ""

  private constructor() {}

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger()
    }
    return StructuredLogger.instance
  }

  setCorrelationId(id: string): void {
    this.correlationId = id
  }

  generateCorrelationId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private log(level: string, message: string, data?: ErrorContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      service: "stargit",
      version: process.env.APP_VERSION || "1.0.0",
      ...data,
    }

    console.log(JSON.stringify(logEntry))
  }

  debug(message: string, data?: ErrorContext): void {
    this.log("debug", message, data)
  }

  info(message: string, data?: ErrorContext): void {
    this.log("info", message, data)
  }

  warn(message: string, data?: ErrorContext): void {
    this.log("warn", message, data)
  }

  error(message: string, error?: Error, data?: ErrorContext): void {
    this.log("error", message, {
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      ...data,
    })
  }

  // Security event logging
  logSecurityEvent(event: string, details: ErrorContext): void {
    this.log("security", `Security event: ${event}`, {
      securityEvent: event,
      ...details,
    })
  }

  // Performance tracking
  logPerformance(operation: string, duration: number, details?: ErrorContext): void {
    this.log("performance", `Performance: ${operation}`, {
      operation,
      duration,
      ...details,
    })
  }

  // Git operation logging
  logGitOperation(operation: string, repository: string, user: string, success: boolean, details?: ErrorContext): void {
    this.log("git", `Git operation: ${operation}`, {
      gitOperation: operation,
      repository,
      user,
      success,
      ...details,
    })
  }

  // Authentication logging
  logAuthEvent(event: string, user: string, method: string, success: boolean, details?: ErrorContext): void {
    this.log("auth", `Auth event: ${event}`, {
      authEvent: event,
      user,
      method,
      success,
      ...details,
    })
  }
}
