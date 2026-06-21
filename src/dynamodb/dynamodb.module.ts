import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DYNAMODB_CLIENT, DYNAMODB_DOCUMENT_CLIENT } from './dynamodb.constants';
import { DynamoDbService } from './dynamodb.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: DYNAMODB_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                try {
                    const region = configService.get<string>('dynamodb.region', 'us-east-1');
                    const endpoint = configService.get<string>('dynamodb.endpoint');
                    const accessKeyId = configService.get<string>('dynamodb.accessKeyId');
                    const secretAccessKey = configService.get<string>('dynamodb.secretAccessKey');

                    return new DynamoDBClient({
                        region,
                        ...(endpoint ? { endpoint } : {}),
                        ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
                    });
                } catch (error) {
                    throw new Error(`Failed to initialize DynamoDB client: ${error instanceof Error ? error.message : String(error)}`);
                }
            },
        },
        {
            provide: DYNAMODB_DOCUMENT_CLIENT,
            inject: [DYNAMODB_CLIENT],
            useFactory: (client: DynamoDBClient) => {
                try {
                    return DynamoDBDocumentClient.from(client, {
                        marshallOptions: { removeUndefinedValues: true },
                    });
                } catch (error) {
                    throw new Error(
                        `Failed to initialize DynamoDB document client: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            },
        },
        DynamoDbService,
    ],
    exports: [DynamoDbService],
})
export class DynamoDbModule {}
