export interface AwsServiceError extends Error {
    name: string;
    message: string;
    $metadata?: {
        httpStatusCode?: number;
        requestId?: string;
    };
}

export interface OpenSearchStatusError {
    statusCode: number;
    message?: string;
}

export function isAwsServiceError(error: unknown): error is AwsServiceError {
    return error instanceof Error && typeof error.name === 'string';
}

export function isOpenSearchNotFoundError(error: unknown): error is OpenSearchStatusError {
    return typeof error === 'object' && error !== null && 'statusCode' in error && (error as OpenSearchStatusError).statusCode === 404;
}
