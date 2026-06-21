import { Test, TestingModule } from '@nestjs/testing';
import { AuthConfig } from '../../config/auth.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: AuthConfig,
                    useValue: {
                        userPoolId: 'test-pool',
                        clientId: 'test-client',
                        clientSecret: 'test-secret',
                        region: 'us-east-1',
                        accesskey: 'test-key',
                        accesssecret: 'test-secret-key',
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
