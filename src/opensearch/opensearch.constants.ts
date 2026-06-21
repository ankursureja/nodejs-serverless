import { Client } from '@opensearch-project/opensearch';
import { OpenSearchIndexMappings } from './opensearch.types';

export const OPENSEARCH_CLIENT = 'OPENSEARCH_CLIENT';

export type OpenSearchServiceType = 'es' | 'aoss';

export type CreateIndexRequestBody = NonNullable<Parameters<Client['indices']['create']>[0]['body']>;

export const PATIENT_INDEX_MAPPINGS: OpenSearchIndexMappings = {
    properties: {
        id: { type: 'keyword' },
        name: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } },
        },
        address: { type: 'text' },
        conditions: { type: 'keyword' },
        conditionsNormalized: { type: 'keyword' },
        conditionsText: { type: 'text' },
        allergies: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
    },
};

export function buildPatientsIndexBody(): CreateIndexRequestBody {
    return {
        settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
        },
        mappings: PATIENT_INDEX_MAPPINGS,
    } as CreateIndexRequestBody;
}
