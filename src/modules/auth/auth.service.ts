import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import {
    AdminAddUserToGroupCommand,
    AdminConfirmSignUpCommand,
    AdminUpdateUserAttributesCommand,
    CognitoIdentityProviderClient,
    ConfirmForgotPasswordCommand,
    ForgotPasswordCommand,
    InitiateAuthCommand,
    SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { AuthConfig } from '../../config/auth.config';
import { ActivateUserDto, ConfirmForgotPasswordDto, ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';
import { mapCognitoError } from './utils/cognito-error.util';
import { decodeJwtPayload, resolveCognitoUsernameForSecretHash } from './utils/cognito-token.util';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
    tokenType: string;
}

export interface RegisterResult {
    userSub: string;
    userConfirmed: boolean;
    message: string;
}

export interface MessageResult {
    message: string;
}

@Injectable()
export class AuthService {
    private readonly cognitoClient: CognitoIdentityProviderClient;

    constructor(private readonly authConfig: AuthConfig) {
        this.cognitoClient = new CognitoIdentityProviderClient({
            region: this.authConfig.region,
            credentials:
                this.authConfig.accesskey && this.authConfig.accessSecret
                    ? {
                          accessKeyId: this.authConfig.accesskey,
                          secretAccessKey: this.authConfig.accessSecret,
                      }
                    : undefined,
        });
    }

    async login(loginDto: LoginDto): Promise<AuthTokens> {
        try {
            const result = await this.cognitoClient.send(
                new InitiateAuthCommand({
                    AuthFlow: 'USER_PASSWORD_AUTH',
                    ClientId: this.authConfig.clientId,
                    AuthParameters: this.buildAuthParameters(loginDto.email, loginDto.password),
                })
            );

            const tokens = result.AuthenticationResult;
            if (!tokens?.AccessToken || !tokens.RefreshToken || !tokens.IdToken) {
                throw new BadRequestException('Authentication failed');
            }

            return {
                accessToken: tokens.AccessToken,
                refreshToken: tokens.RefreshToken,
                idToken: tokens.IdToken,
                expiresIn: tokens.ExpiresIn ?? 0,
                tokenType: tokens.TokenType ?? 'Bearer',
            };
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'logging in');
        }
    }

    async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
        try {
            const username = this.resolveUsernameForSecretHash(refreshTokenDto);

            const result = await this.cognitoClient.send(
                new InitiateAuthCommand({
                    AuthFlow: 'REFRESH_TOKEN_AUTH',
                    ClientId: this.authConfig.clientId,
                    AuthParameters: this.buildRefreshAuthParameters(username, refreshTokenDto.refreshToken),
                })
            );

            const tokens = result.AuthenticationResult;
            if (!tokens?.AccessToken || !tokens.IdToken) {
                throw new BadRequestException('Token refresh failed');
            }

            return {
                accessToken: tokens.AccessToken,
                refreshToken: tokens.RefreshToken ?? refreshTokenDto.refreshToken,
                idToken: tokens.IdToken,
                expiresIn: tokens.ExpiresIn ?? 0,
                tokenType: tokens.TokenType ?? 'Bearer',
            };
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'refreshing tokens');
        }
    }

    async register(registerDto: RegisterDto): Promise<RegisterResult> {
        try {
            const result = await this.cognitoClient.send(
                new SignUpCommand({
                    ClientId: this.authConfig.clientId,
                    Username: registerDto.email,
                    Password: registerDto.password,
                    ...this.withSecretHash(registerDto.email),
                    UserAttributes: [
                        { Name: 'email', Value: registerDto.email },
                        { Name: 'name', Value: registerDto.name },
                        { Name: 'phone_number', Value: registerDto.phoneNumber },
                    ],
                })
            );

            const groupName = 'user';
            await this.addUserToGroup(registerDto.email, groupName);

            return {
                userSub: result.UserSub ?? '',
                userConfirmed: result.UserConfirmed ?? false,
                message: result.UserConfirmed ? 'Registration successful.' : 'Registration successful.',
            };
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'registering user');
        }
    }

    async addUserToGroup(username: string, groupName: string): Promise<boolean> {
        try {
            await this.cognitoClient.send(
                new AdminAddUserToGroupCommand({
                    UserPoolId: this.authConfig.userPoolId,
                    Username: username,
                    GroupName: groupName,
                })
            );

            return true;
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'adding user to group');
        }
    }

    async activateUserWithoutCode(activateUserDto: ActivateUserDto): Promise<MessageResult> {
        try {
            await this.confirmUserIfNeeded(activateUserDto.email);
            await this.markContactInfoVerified(activateUserDto.email);
            return {
                message: 'Your account has been activated successfully. You can now log in.',
            };
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'confirming user registration');
        }
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<MessageResult> {
        try {
            await this.cognitoClient.send(
                new ForgotPasswordCommand({
                    ClientId: this.authConfig.clientId,
                    Username: forgotPasswordDto.email,
                    ...this.withSecretHash(forgotPasswordDto.email),
                })
            );

            return {
                message: 'Otp has been sent in your email.',
            };
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'initiating password reset');
        }
    }

    async confirmForgotPassword(confirmForgotPasswordDto: ConfirmForgotPasswordDto): Promise<MessageResult> {
        try {
            await this.cognitoClient.send(
                new ConfirmForgotPasswordCommand({
                    ClientId: this.authConfig.clientId,
                    Username: confirmForgotPasswordDto.email,
                    ConfirmationCode: confirmForgotPasswordDto.confirmationCode,
                    Password: confirmForgotPasswordDto.newPassword,
                    ...this.withSecretHash(confirmForgotPasswordDto.email),
                })
            );

            return {
                message: 'Password has been reset successfully. You can now log in.',
            };
        } catch (error: unknown) {
            throw this.handleCognitoError(error, 'confirming password reset');
        }
    }

    private async confirmUserIfNeeded(username: string): Promise<void> {
        try {
            await this.cognitoClient.send(
                new AdminConfirmSignUpCommand({
                    UserPoolId: this.authConfig.userPoolId,
                    Username: username,
                })
            );
        } catch (error: unknown) {
            if (!this.isAlreadyConfirmedError(error)) {
                throw error;
            }
        }
    }

    private async markContactInfoVerified(username: string): Promise<void> {
        await this.cognitoClient.send(
            new AdminUpdateUserAttributesCommand({
                UserPoolId: this.authConfig.userPoolId,
                Username: username,
                UserAttributes: [
                    { Name: 'email_verified', Value: 'true' },
                    { Name: 'phone_number_verified', Value: 'true' },
                ],
            })
        );
    }

    private isAlreadyConfirmedError(error: unknown): boolean {
        return (
            error instanceof Error &&
            (error.name === 'NotAuthorizedException' || error.name === 'InvalidParameterException') &&
            error.message.toLowerCase().includes('confirmed')
        );
    }

    private resolveUsernameForSecretHash(refreshTokenDto: RefreshTokenDto): string {
        if (refreshTokenDto.idToken) {
            const payload = decodeJwtPayload(refreshTokenDto.idToken);
            return resolveCognitoUsernameForSecretHash(payload);
        }

        if (refreshTokenDto.email) {
            return refreshTokenDto.email;
        }

        if (this.authConfig.clientSecret) {
            throw new BadRequestException(
                'idToken or email is required. Prefer idToken — Cognito SECRET_HASH needs cognito:username when email alias is enabled.'
            );
        }

        return '';
    }

    private buildRefreshAuthParameters(username: string, refreshToken: string): Record<string, string> {
        const params: Record<string, string> = {
            REFRESH_TOKEN: refreshToken,
        };

        const secretHash = this.generateSecretHash(username);
        if (secretHash) {
            params.SECRET_HASH = secretHash;
        }

        return params;
    }

    private buildAuthParameters(username: string, password: string): Record<string, string> {
        const params: Record<string, string> = {
            USERNAME: username,
            PASSWORD: password,
        };

        const secretHash = this.generateSecretHash(username);
        if (secretHash) {
            params.SECRET_HASH = secretHash;
        }

        return params;
    }

    private withSecretHash(username: string): { SecretHash?: string } {
        const secretHash = this.generateSecretHash(username);
        return secretHash ? { SecretHash: secretHash } : {};
    }

    private generateSecretHash(username: string): string | undefined {
        if (!this.authConfig.clientSecret) {
            return undefined;
        }

        return createHmac('sha256', this.authConfig.clientSecret)
            .update(username + this.authConfig.clientId)
            .digest('base64');
    }

    private handleCognitoError(error: unknown, context: string): HttpException {
        return mapCognitoError(error, context);
    }
}
