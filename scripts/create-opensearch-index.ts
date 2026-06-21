import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import 'dotenv/config';
import { resolveOpenSearchService } from '../src/config/opensearch.config';
import { buildPatientsIndexBody } from '../src/opensearch/opensearch.constants';

const endpoint = process.env.OPENSEARCH_ENDPOINT;
const indexName = process.env.OPENSEARCH_PATIENTS_INDEX || 'patients';
const region = process.env.AWS_REGION || 'us-east-1';
const service = resolveOpenSearchService(process.env.OPENSEARCH_SERVICE);
const disableAuth = process.env.OPENSEARCH_DISABLE_AUTH === 'true';

if (!endpoint) {
    throw new Error('OPENSEARCH_ENDPOINT must be set');
}

function createClient(): Client {
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

async function createPatientsIndex(): Promise<void> {
    const client = createClient();

    try {
        const exists = await client.indices.exists({ index: indexName });

        if (exists.body) {
            console.log(`OpenSearch index "${indexName}" already exists.`);
            return;
        }

        await client.indices.create({
            index: indexName,
            body: buildPatientsIndexBody(),
        });

        console.log(`OpenSearch index "${indexName}" created successfully.`);
    } catch (error: unknown) {
        console.error(`Failed to create OpenSearch index "${indexName}":`, error);
        throw error;
    }
}

createPatientsIndex().catch((error: unknown) => {
    console.error('Failed to initialize OpenSearch index:', error);
    process.exit(1);
});
