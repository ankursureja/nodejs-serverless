import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CognitoTokenService } from '../services/cognito-token.service';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
    constructor(private readonly cognitoTokenService: CognitoTokenService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractBearerToken(request);

        if (!token) {
            throw new UnauthorizedException('Missing access token');
        }

        request.user = await this.cognitoTokenService.verifyAccessToken(token);
        return true;
    }

    private extractBearerToken(request: Request): string | undefined {
        const authorization = request.headers.authorization;

        if (!authorization?.startsWith('Bearer ')) {
            return undefined;
        }

        return authorization.slice('Bearer '.length).trim();
    }
}
