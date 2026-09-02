import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '@lms/types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const anyRes = res as any;
        if (anyRes.error && anyRes.error.code) {
          // Already formatted BusinessException
          return response.status(status).json(anyRes);
        }

        if (Array.isArray(anyRes.message)) {
          errorCode = ErrorCode.VALIDATION_ERROR;
          message = anyRes.message.join(', ');
          details = anyRes.message;
        } else {
          message = anyRes.message || exception.message;
          errorCode = (anyRes.error as ErrorCode) || ErrorCode.VALIDATION_ERROR;
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      console.error('ALL_EXCEPTIONS_FILTER CAUGHT:', exception.message, exception.stack);
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
    });
  }
}
