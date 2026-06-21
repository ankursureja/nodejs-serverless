import { OpenSearchServiceType } from '../opensearch/opensearch.constants';

export function resolveOpenSearchService(value?: string): OpenSearchServiceType {
    return value === 'aoss' ? 'aoss' : 'es';
}

export default () => ({
    opensearch: {
        endpoint: process.env.OPENSEARCH_ENDPOINT,
        patientsIndex: process.env.OPENSEARCH_PATIENTS_INDEX || 'patients',
        region: process.env.AWS_REGION || 'us-east-1',
        service: resolveOpenSearchService(process.env.OPENSEARCH_SERVICE),
        disableAuth: process.env.OPENSEARCH_DISABLE_AUTH === 'true',
    },
});
