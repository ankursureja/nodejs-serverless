import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
import { ErrorHandler } from '../common/utils/error-handler.util';
import { buildPatientsIndexBody, OPENSEARCH_CLIENT } from './opensearch.constants';

@Injectable()
export class OpenSearchService implements OnModuleInit {
    private readonly logger = new Logger(OpenSearchService.name);

    constructor(
        @Inject(OPENSEARCH_CLIENT)
        private readonly client: Client,
        private readonly configService: ConfigService
    ) {}

    get indexName(): string {
        return this.configService.get<string>('opensearch.patientsIndex', 'patients');
    }

    async onModuleInit(): Promise<void> {
        if (!this.configService.get<string>('opensearch.endpoint')) {
            this.logger.warn('OPENSEARCH_ENDPOINT is not set. OpenSearch indexing and search are disabled.');
            return;
        }

        try {
            await this.ensurePatientsIndex();
        } catch (error: unknown) {
            this.logger.error('Failed to initialize OpenSearch patients index', error);
        }
    }

    async ensurePatientsIndex(): Promise<void> {
        try {
            const exists = await this.client.indices.exists({
                index: this.indexName,
            });

            if (exists.body) {
                return;
            }

            await this.client.indices.create({
                index: this.indexName,
                body: buildPatientsIndexBody(),
            });

            this.logger.log(`OpenSearch index "${this.indexName}" created.`);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'ensuring OpenSearch patients index');
        }
    }

    getClient(): Client {
        return this.client;
    }

    isEnabled(): boolean {
        return Boolean(this.configService.get<string>('opensearch.endpoint'));
    }
}
