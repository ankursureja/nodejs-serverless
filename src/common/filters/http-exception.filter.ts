import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../types/api-response.types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const errorResponse: string | Record<string, unknown> =
            exception instanceof HttpException ? (exception.getResponse() as string | Record<string, unknown>) : 'Internal server error';

        if (!(exception instanceof HttpException)) {
            this.logger.error(
                `Unhandled exception on ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception)
            );
        } else if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
            this.logger.error(`Server error on ${request.method} ${request.url}`, exception.stack);
        }

        const body: ApiErrorResponse = {
            success: false,
            statusCode: status,
            path: request.url,
            message: errorResponse,
            timestamp: new Date().toISOString(),
        };

        response.status(status).json(body);
    }
}
