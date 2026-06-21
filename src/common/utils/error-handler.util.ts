import {
    BadRequestException,
    ConflictException,
    HttpException,
    InternalServerErrorException,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { isAwsServiceError } from '../types/aws-error.types';

export class ErrorHandler {
    private static readonly logger = new Logger(ErrorHandler.name);

    static handle(error: unknown, context: string): never {
        this.logError(error, context);

        if (error instanceof HttpException) {
            throw error;
        }

        throw this.toHttpException(error, context);
    }

    static toHttpException(error: unknown, context: string): HttpException {
        if (error instanceof HttpException) {
            return error;
        }

        const dynamoError = this.mapDynamoDbError(error, context);
        if (dynamoError) {
            return dynamoError;
        }

        if (error instanceof Error) {
            return new InternalServerErrorException(`An unexpected error occurred while ${context}: ${error.message}`);
        }

        return new InternalServerErrorException(`An unexpected error occurred while ${context}`);
    }

    private static mapDynamoDbError(error: unknown, context: string): HttpException | null {
        if (!isAwsServiceError(error)) {
            return null;
        }

        switch (error.name) {
            case 'ConditionalCheckFailedException':
            case 'TransactionCanceledException':
                return new ConflictException(`Operation could not be completed due to a conflict during ${context}`);
            case 'ResourceNotFoundException':
                return new ServiceUnavailableException(`Required DynamoDB resource was not found during ${context}`);
            case 'ValidationException':
                return new BadRequestException(error.message || `Invalid DynamoDB request during ${context}`);
            case 'ProvisionedThroughputExceededException':
            case 'RequestLimitExceeded':
            case 'ThrottlingException':
                return new ServiceUnavailableException('Database request limit exceeded. Please try again later.');
            case 'InternalServerError':
                return new ServiceUnavailableException('DynamoDB encountered an internal error. Please try again later.');
            default:
                return null;
        }
    }

    private static logError(error: unknown, context: string): void {
        if (error instanceof HttpException) {
            if (error.getStatus() >= 500) {
                this.logger.error(`HTTP error in ${context}`, error.stack);
            }
            return;
        }

        if (error instanceof Error) {
            this.logger.error(`Error in ${context}: ${error.message}`, error.stack);
            return;
        }

        this.logger.error(`Unknown error in ${context}`, String(error));
    }
}
