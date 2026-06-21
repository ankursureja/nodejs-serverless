import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpException,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';

export function mapCognitoError(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
        return error;
    }

    if (error instanceof Error && 'name' in error) {
        switch (error.name) {
            case 'NotAuthorizedException':
                return new UnauthorizedException(
                    context === 'refreshing tokens' ? 'Invalid or expired refresh token' : 'Invalid email or password'
                );
            case 'UserNotFoundException':
                return new UnauthorizedException('Invalid email or password');
            case 'UsernameExistsException':
                return new ConflictException('An account with this email already exists');
            case 'InvalidPasswordException':
            case 'CodeMismatchException':
            case 'ExpiredCodeException':
                return new BadRequestException(error.message);
            case 'InvalidParameterException':
                if (error.message.toLowerCase().includes('no registered/verified email')) {
                    return new BadRequestException(
                        'Password reset is unavailable because the account email or phone is not verified. Please activate your account first.'
                    );
                }
                return new BadRequestException(error.message);
            case 'UserNotConfirmedException':
                return new ForbiddenException('Account is not confirmed. Please verify your email.');
            case 'LimitExceededException':
                return new BadRequestException('Too many attempts. Please try again later.');
            default:
                return new InternalServerErrorException(`Failed while ${context}: ${error.message}`);
        }
    }

    return new InternalServerErrorException(`Failed while ${context}`);
}
