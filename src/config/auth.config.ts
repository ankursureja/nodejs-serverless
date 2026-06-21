import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConfig {
    public userPoolId: string = process.env.AWS_COGNITO_USER_POOL_ID || '';
    public clientId: string = process.env.AWS_COGNITO_CLIENT_ID || '';
    public clientSecret: string = process.env.AWS_COGNITO_SECRET || '';
    public region: string = process.env.AWS_REGION || '';
    public accesskey: string = process.env.AWS_ACCESS_KEY_ID || '';
    public accessSecret: string = process.env.AWS_SECRET_ACCESS_KEY || '';

    public authority = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`;
}
