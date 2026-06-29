import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
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
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let errorCode: string | undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        errorCode = resp.errorCode;
      } else {
        message = exceptionResponse as string;
      }
      stack = exception.stack;
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      errorCode = 'INTERNAL_ERROR';
      stack = exception.stack;

      // Log unexpected errors
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '未知错误';
      errorCode = 'UNKNOWN_ERROR';
    }

    // Don't expose stack trace in production
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
    };

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      errorResponse.stack = stack;
    }

    response.status(status).json(errorResponse);
  }
}