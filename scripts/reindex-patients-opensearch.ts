import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import 'dotenv/config';
import { resolveOpenSearchService } from '../src/config/opensearch.config';
import { PATIENT_ENTITY_TYPES } from '../src/dynamodb/dynamodb.constants';
import { PatientProfileRecord } from '../src/modules/patients/interfaces/patient.interface';
import { buildPatientsIndexBody } from '../src/opensearch/opensearch.constants';

const tableName = process.env.DYNAMODB_PATIENTS_TABLE || 'patients';
const indexName = process.env.OPENSEARCH_PATIENTS_INDEX || 'patients';
const endpoint = process.env.OPENSEARCH_ENDPOINT;
const region = process.env.AWS_REGION || 'us-east-1';
const service = resolveOpenSearchService(process.env.OPENSEARCH_SERVICE);
const disableAuth = process.env.OPENSEARCH_DISABLE_AUTH === 'true';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!endpoint) {
    throw new Error('OPENSEARCH_ENDPOINT must be set');
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function createOpenSearchClient(): Client {
    if (disableAuth) {
        return new Client({ node: endpoint });
    }

    return new Client({
        ...AwsSigv4Signer({
            region,
            service,
            getCredentials: () => defaultProvider()(),
        }),
        node: endpoint,
    });
}

function createDynamoClient(): DynamoDBDocumentClient {
    return DynamoDBDocumentClient.from(
        new DynamoDBClient({
            region,
            ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
        }),
        { marshallOptions: { removeUndefinedValues: true } }
    );
}

async function ensureIndex(client: Client): Promise<void> {
    const exists = await client.indices.exists({ index: indexName });

    if (!exists.body) {
        await client.indices.create({
            index: indexName,
            body: buildPatientsIndexBody(),
        });
    }
}

async function reindexPatients(): Promise<void> {
    const openSearchClient = createOpenSearchClient();
    const dynamoClient = createDynamoClient();

    await ensureIndex(openSearchClient);

    let lastEvaluatedKey: Record<string, NativeAttributeValue> | undefined;
    let indexed = 0;

    do {
        const result = await dynamoClient.send(
            new ScanCommand({
                TableName: tableName,
                FilterExpression: 'entityType = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': PATIENT_ENTITY_TYPES.PROFILE,
                },
                ExclusiveStartKey: lastEvaluatedKey,
            })
        );

        for (const item of result.Items ?? []) {
            const profile = item as PatientProfileRecord;
            const conditions = profile.conditions ?? [];
            const conditionsNormalized = conditions.map(normalize);

            await openSearchClient.index({
                index: indexName,
                id: profile.id,
                body: {
                    id: profile.id,
                    name: profile.name,
                    address: profile.address,
                    conditions,
                    conditionsNormalized,
                    conditionsText: conditions.join(' '),
                    allergies: profile.allergies ?? [],
                    createdAt: profile.createdAt,
                    updatedAt: profile.updatedAt,
                },
                refresh: false,
            });

            indexed += 1;
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    await openSearchClient.indices.refresh({ index: indexName });
    console.log(`Reindexed ${indexed} patient(s) into OpenSearch index "${indexName}".`);
}

reindexPatients().catch((error: unknown) => {
    console.error('Failed to reindex patients:', error);
    process.exit(1);
});
