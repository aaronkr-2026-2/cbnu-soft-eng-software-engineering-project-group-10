import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
@Catch()
export class SafeErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeErrorFilter.name);
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (res.headersSent) {
      res.end();
      return;
    }
    if (error instanceof HttpException) {
      const body = error.getResponse();
      res
        .status(error.getStatus())
        .json(
          typeof body === 'string'
            ? { statusCode: error.getStatus(), message: body }
            : body,
        );
      return;
    }
    if (error && typeof error === 'object' && 'type' in error) {
      if (error.type === 'entity.too.large') {
        res
          .status(413)
          .json({
            statusCode: 413,
            message: 'Request body too large',
            error: 'Payload Too Large',
          });
        return;
      }
      if (
        error.type === 'encoding.unsupported' ||
        error.type === 'charset.unsupported'
      ) {
        res
          .status(415)
          .json({
            statusCode: 415,
            message: 'Unsupported body encoding',
            error: 'Unsupported Media Type',
          });
        return;
      }
      if (error.type === 'entity.parse.failed') {
        res
          .status(400)
          .json({
            statusCode: 400,
            message: 'Invalid JSON',
            error: 'Bad Request',
          });
        return;
      }
    }
    // Do not log raw database errors, request bodies, SQL parameters or tokens.
    this.logger.error('Unhandled request failure');
    res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}
