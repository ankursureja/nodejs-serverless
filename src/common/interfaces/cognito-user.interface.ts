export interface CognitoUser {
    sub: string;
    username: string;
    email?: string;
    groups: string[];
}
