import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthConfig } from '../../config/auth.config';
import { CognitoAuthGuard } from '../../common/guards/cognito-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CognitoTokenService } from '../../common/services/cognito-token.service';

@Module({
    controllers: [AuthController],
    providers: [AuthService, AuthConfig, CognitoTokenService, CognitoAuthGuard, RolesGuard],
    exports: [AuthConfig, CognitoTokenService, CognitoAuthGuard, RolesGuard],
})
export class AuthModule {}
