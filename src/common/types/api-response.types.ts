export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    timestamp: string;
}

export interface ApiErrorResponse {
    success: false;
    statusCode: number;
    path: string;
    message: string | Record<string, unknown>;
    timestamp: string;
}
