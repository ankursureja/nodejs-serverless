import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { OpenSearchServiceType, OPENSEARCH_CLIENT } from './opensearch.constants';
import { OpenSearchService } from './opensearch.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: OPENSEARCH_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const endpoint = configService.get<string>('OPENSEARCH_ENDPOINT');
                const region = configService.get<string>('AWS_REGION', 'ap-south-1');
                const service = configService.get<OpenSearchServiceType>('OPENSEARCH_SERVICE', 'es');
                const disableAuth = configService.get<boolean>('OPENSEARCH_DISABLE_AUTH', false);

                if (!endpoint) {
                    return new Client({ node: 'http://localhost:9200' });
                }

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
            },
        },
        OpenSearchService,
    ],
    exports: [OpenSearchService],
})
export class OpenSearchModule {}
