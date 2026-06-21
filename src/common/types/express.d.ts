import { CognitoUser } from '../interfaces/cognito-user.interface';

declare module 'express-serve-static-core' {
    interface Request {
        user?: CognitoUser;
    }
}
