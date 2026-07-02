import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  errorCode?: string;
  stack?: string;
}

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopmentOrDebug =
      process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

    let status: number;
    let message: string | string[];
    let errorCode: string | undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) || exception.message;
        errorCode = resp.errorCode as string | undefined;
      } else {
        message = exceptionResponse as string;
      }
      stack = exception.stack;

      // Log server errors (5xx) and client errors (4xx)
      if (status >= 500) {
        this.logger.error(
          `HttpException ${status} ${request.method} ${request.url}: ${exception.message}`,
          exception.stack,
        );
        // In production, hide internal error details for 5xx responses
        if (isProduction) {
          message = '服务器内部错误';
          errorCode = 'INTERNAL_ERROR';
        }
      } else if (status >= 400) {
        this.logger.warn(
          `HttpException ${status} ${request.method} ${request.url}: ${exception.message}`,
        );
      }
    } else if (
      exception instanceof SyntaxError &&
      /JSON|Unexpected token|Unexpected end/i.test(exception.message)
    ) {
      // Handle JSON parse errors from body-parser (malformed request body)
      status = HttpStatus.BAD_REQUEST;
      message = '无效的请求数据格式';
      errorCode = 'INVALID_JSON';
      stack = exception.stack;

      this.logger.warn(
        `Invalid JSON ${request.method} ${request.url}: ${exception.message}`,
      );
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      errorCode = 'INTERNAL_ERROR';
      stack = exception.stack;

      this.logger.error(
        `Unexpected error ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      // Non-Error throws (plain strings, numbers, null, undefined, etc.)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '未知错误';
      errorCode = 'UNKNOWN_ERROR';

      // Attempt to stringify the thrown value for logging
      let thrownDescription: string;
      try {
        thrownDescription =
          exception === null
            ? 'null'
            : exception === undefined
              ? 'undefined'
              : typeof exception === 'object'
                ? JSON.stringify(exception)
                : String(exception);
      } catch {
        thrownDescription = '[unserializable value]';
      }

      this.logger.error(
        `Unknown error type (${typeof exception}) ${request.method} ${request.url}: ${thrownDescription}`,
      );
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
    };

    if (isDevelopmentOrDebug && stack) {
      errorResponse.stack = stack;
    }

    response.status(status).json(errorResponse);
  }
}
