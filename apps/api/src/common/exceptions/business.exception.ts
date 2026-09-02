import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@lms/types';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    status: HttpStatus = HttpStatus.CONFLICT,
    public readonly details?: any
  ) {
    super(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
      },
      status
    );
  }
}
