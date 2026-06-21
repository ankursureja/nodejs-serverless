import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { CognitoAccessTokenPayload } from 'aws-jwt-verify/jwt-model';
import { AuthConfig } from '../../config/auth.config';
import { CognitoUser } from '../interfaces/cognito-user.interface';

@Injectable()
export class CognitoTokenService {
    private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

    constructor(private readonly authConfig: AuthConfig) {
        this.verifier = CognitoJwtVerifier.create({
            userPoolId: this.authConfig.userPoolId,
            tokenUse: 'access',
            clientId: this.authConfig.clientId,
        });
    }

    async verifyAccessToken(token: string): Promise<CognitoUser> {
        try {
            const payload = (await this.verifier.verify(token)) as CognitoAccessTokenPayload;

            return {
                sub: payload.sub,
                username: payload.username,
                email: typeof payload.email === 'string' ? payload.email : undefined,
                groups: this.extractGroups(payload),
            };
        } catch {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }

    private extractGroups(payload: CognitoAccessTokenPayload): string[] {
        const groups = payload['cognito:groups'];

        if (Array.isArray(groups)) {
            return groups.filter((group): group is string => typeof group === 'string');
        }

        return [];
    }
}
