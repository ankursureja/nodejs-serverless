import { CreateTableCommand, DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import 'dotenv/config';

const tableName = process.env.DYNAMODB_PATIENTS_TABLE || 'patients';
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY must be set');
}

const client = new DynamoDBClient({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

async function tableExists(): Promise<boolean> {
    try {
        await client.send(new DescribeTableCommand({ TableName: tableName }));
        return true;
    } catch (error: unknown) {
        console.warn(
            `Unable to describe table "${tableName}". Assuming it does not exist.`,
            error instanceof Error ? error.message : error
        );
        return false;
    }
}

async function createPatientsTable(): Promise<void> {
    try {
        if (await tableExists()) {
            console.log(`Table "${tableName}" already exists.`);
            return;
        }

        await client.send(
            new CreateTableCommand({
                TableName: tableName,
                BillingMode: 'PAY_PER_REQUEST',
                AttributeDefinitions: [
                    { AttributeName: 'pk', AttributeType: 'S' },
                    { AttributeName: 'sk', AttributeType: 'S' },
                ],
                KeySchema: [
                    { AttributeName: 'pk', KeyType: 'HASH' },
                    { AttributeName: 'sk', KeyType: 'RANGE' },
                ],
            })
        );

        console.log(`Table "${tableName}" created successfully.`);
    } catch (error: unknown) {
        console.error(`Failed to create table "${tableName}":`, error);
        throw error;
    }
}

createPatientsTable().catch((error: unknown) => {
    console.error('Failed to create DynamoDB table:', error);
    process.exit(1);
});
