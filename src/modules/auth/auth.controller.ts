import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from '../../common/utils/error-handler.util';
import { AuthService, AuthTokens, MessageResult, RegisterResult } from './auth.service';
import {
    ActivateUserDto,
    AuthTokenResponseDto,
    ConfirmForgotPasswordDto,
    ForgotPasswordDto,
    LoginDto,
    MessageResponseDto,
    RefreshTokenDto,
    RegisterDto,
    RegisterResponseDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate a user and return Cognito tokens' })
    @ApiOkResponse({ type: AuthTokenResponseDto })
    async loginAction(@Body() loginDto: LoginDto): Promise<AuthTokens> {
        try {
            return await this.authService.login(loginDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'logging in');
        }
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Issue new access and ID tokens using a refresh token' })
    @ApiOkResponse({ type: AuthTokenResponseDto })
    async refreshTokenAction(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
        try {
            return await this.authService.refreshTokens(refreshTokenDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'refreshing tokens');
        }
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user in Cognito' })
    @ApiCreatedResponse({ type: RegisterResponseDto })
    async registerAction(@Body() registerDto: RegisterDto): Promise<RegisterResult> {
        try {
            return await this.authService.register(registerDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'registering user');
        }
    }

    @Post('activate-user')
    @ApiOperation({ summary: 'Activate a new user in Cognito' })
    @ApiCreatedResponse({ type: RegisterResponseDto })
    async activateUserAction(@Body() activateUserDto: ActivateUserDto): Promise<MessageResult> {
        try {
            return await this.authService.activateUserWithoutCode(activateUserDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'activating user');
        }
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request a password reset code via email' })
    @ApiOkResponse({ type: MessageResponseDto })
    async forgotPasswordAction(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<MessageResult> {
        try {
            return await this.authService.forgotPassword(forgotPasswordDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'requesting password reset');
        }
    }

    @Post('confirm-forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Confirm password reset with email code and new password' })
    @ApiOkResponse({ type: MessageResponseDto })
    async confirmForgotPasswordAction(@Body() confirmForgotPasswordDto: ConfirmForgotPasswordDto): Promise<MessageResult> {
        try {
            return await this.authService.confirmForgotPassword(confirmForgotPasswordDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'confirming password reset');
        }
    }
}
