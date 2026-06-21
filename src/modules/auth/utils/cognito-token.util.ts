import { BadRequestException } from '@nestjs/common';

export function decodeJwtPayload(token: string): Record<string, unknown> {
    const segments = token.split('.');
    if (segments.length < 2) {
        throw new BadRequestException('Invalid token format');
    }

    const payloadSegment = segments[1];
    if (!payloadSegment) {
        throw new BadRequestException('Invalid token format');
    }

    try {
        const json = Buffer.from(payloadSegment, 'base64url').toString('utf8');
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        throw new BadRequestException('Invalid token format');
    }
}

export function resolveCognitoUsernameForSecretHash(tokenPayload: Record<string, unknown>): string {
    const cognitoUsername = tokenPayload['cognito:username'];
    if (typeof cognitoUsername === 'string' && cognitoUsername.length > 0) {
        return cognitoUsername;
    }

    const username = tokenPayload.username;
    if (typeof username === 'string' && username.length > 0) {
        return username;
    }

    const email = tokenPayload.email;
    if (typeof email === 'string' && email.length > 0) {
        return email;
    }

    throw new BadRequestException('Unable to resolve Cognito username from token');
}
