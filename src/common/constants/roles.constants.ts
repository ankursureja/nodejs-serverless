export const ROLES_KEY = 'roles';

/** Must match Cognito group names exactly */
export enum CognitoGroup {
    ADMIN = 'admin',
    DOCTOR = 'doctor',
    NURSE = 'nurse',
    USER = 'user',
}

export const PATIENT_READ_ROLES = [CognitoGroup.ADMIN, CognitoGroup.DOCTOR, CognitoGroup.NURSE, CognitoGroup.USER];

export const PATIENT_WRITE_ROLES = [CognitoGroup.ADMIN, CognitoGroup.DOCTOR, CognitoGroup.USER];

export const PATIENT_DELETE_ROLES = [CognitoGroup.ADMIN];
