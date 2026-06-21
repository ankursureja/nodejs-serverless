import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ErrorHandler } from '../../common/utils/error-handler.util';
import { isOpenSearchNotFoundError } from '../../common/types/aws-error.types';
import { OpenSearchService } from '../../opensearch/opensearch.service';
import { Patient } from './interfaces/patient.interface';
import { PatientSearchDocument, PatientSearchResult } from './interfaces/patient-search.interface';
import { normalizeLookupValue } from './utils/normalize.util';

@Injectable()
export class PatientsOpenSearchRepository {
    private readonly logger = new Logger(PatientsOpenSearchRepository.name);

    constructor(private readonly openSearchService: OpenSearchService) {}

    async indexPatient(patient: Patient): Promise<void> {
        if (!this.openSearchService.isEnabled()) {
            return;
        }

        try {
            const document = this.toSearchDocument(patient);

            await this.openSearchService.getClient().index({
                index: this.openSearchService.indexName,
                id: patient.id,
                body: document,
                refresh: true,
            });
        } catch (error: unknown) {
            this.logger.error(`Failed to index patient ${patient.id} in OpenSearch`, error instanceof Error ? error.stack : String(error));
        }
    }

    async deletePatient(patientId: string): Promise<void> {
        if (!this.openSearchService.isEnabled()) {
            return;
        }

        try {
            await this.openSearchService.getClient().delete({
                index: this.openSearchService.indexName,
                id: patientId,
                refresh: true,
            });
        } catch (error: unknown) {
            if (isOpenSearchNotFoundError(error)) {
                return;
            }

            this.logger.error(
                `Failed to delete patient ${patientId} from OpenSearch`,
                error instanceof Error ? error.stack : String(error)
            );
        }
    }

    async searchByCondition(condition: string, from = 0, size = 20): Promise<PatientSearchResult> {
        if (!this.openSearchService.isEnabled()) {
            throw new ServiceUnavailableException('OpenSearch is not configured. Set OPENSEARCH_ENDPOINT to enable search.');
        }

        try {
            const normalizedCondition = normalizeLookupValue(condition);

            const response = await this.openSearchService.getClient().search({
                index: this.openSearchService.indexName,
                from,
                size,
                body: {
                    query: {
                        bool: {
                            should: [
                                {
                                    term: {
                                        conditionsNormalized: normalizedCondition,
                                    },
                                },
                                {
                                    wildcard: {
                                        conditionsNormalized: `*${normalizedCondition}*`,
                                    },
                                },
                                {
                                    match: {
                                        conditionsText: {
                                            query: condition,
                                            fuzziness: 'AUTO',
                                        },
                                    },
                                },
                            ],
                            minimum_should_match: 1,
                        },
                    },
                    sort: [{ updatedAt: { order: 'desc' } }],
                },
            });

            const hits = response.body.hits?.hits ?? [];
            const totalValue = response.body.hits?.total;
            const total =
                typeof totalValue === 'number' ? totalValue : typeof totalValue === 'object' && totalValue !== null ? totalValue.value : 0;

            return {
                total,
                patients: hits.map((hit) => this.fromSearchDocument(hit._source as PatientSearchDocument)),
            };
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'searching patients by condition in OpenSearch');
        }
    }

    private toSearchDocument(patient: Patient): PatientSearchDocument {
        const conditionsNormalized = patient.conditions.map((condition) => normalizeLookupValue(condition));

        return {
            id: patient.id,
            name: patient.name,
            address: patient.address,
            conditions: patient.conditions,
            conditionsNormalized,
            conditionsText: patient.conditions.join(' '),
            allergies: patient.allergies,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
        };
    }

    private fromSearchDocument(document: PatientSearchDocument): Patient {
        return {
            id: document.id,
            name: document.name,
            address: document.address,
            conditions: document.conditions,
            allergies: document.allergies,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        };
    }
}
