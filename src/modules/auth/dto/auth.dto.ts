import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[\W_]).{8,20}$/;
const E164_PHONE_RULE = /^\+[1-9]\d{1,14}$/;

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Password@123' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: '+919639639639',
        description: 'Phone number in E.164 format (e.g. +919639639639)',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(E164_PHONE_RULE, {
        message: 'Phone number must be in E.164 format, e.g. +919639639639',
    })
    phoneNumber: string;

    @ApiProperty({ example: 'Password@123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(PASSWORD_RULE, {
        message: 'Password must be 8-20 characters and contain at least one uppercase letter and one special character.',
    })
    password: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ActivateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class RefreshTokenDto {
    @ApiProperty({ description: 'Refresh token returned from the login response' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;

    @ApiPropertyOptional({
        description:
            'ID token from login (may be expired). Preferred — Cognito SECRET_HASH must use cognito:username, not email, when email alias is enabled.',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    idToken?: string;

    @ApiPropertyOptional({
        example: 'user@example.com',
        description: 'Fallback when idToken is not sent. Only works if email is the Cognito username.',
    })
    @IsOptional()
    @IsEmail()
    email?: string;
}

export class ConfirmForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    confirmationCode: string;

    @ApiProperty({ example: 'NewPassword@123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(PASSWORD_RULE, {
        message: 'Password must be 8-20 characters and contain at least one uppercase letter and one special character.',
    })
    newPassword: string;
}

export class AuthTokenResponseDto {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;

    @ApiProperty()
    idToken: string;

    @ApiProperty()
    expiresIn: number;

    @ApiProperty({ example: 'Bearer' })
    tokenType: string;
}

export class RegisterResponseDto {
    @ApiProperty()
    userSub: string;

    @ApiProperty()
    userConfirmed: boolean;

    @ApiProperty()
    message: string;
}

export class MessageResponseDto {
    @ApiProperty()
    message: string;
}
