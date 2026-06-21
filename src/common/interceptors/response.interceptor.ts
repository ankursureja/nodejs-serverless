import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiSuccessResponse } from '../types/api-response.types';
import { ErrorHandler } from '../utils/error-handler.util';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
        const request = context.switchToHttp().getRequest<Request>();

        return next.handle().pipe(
            map(
                (data: T): ApiSuccessResponse<T> => ({
                    success: true,
                    data,
                    timestamp: new Date().toISOString(),
                })
            ),
            catchError((error: unknown) =>
                throwError(() => {
                    ErrorHandler.handle(error, `processing ${request.method} ${request.url}`);
                })
            )
        );
    }
}
