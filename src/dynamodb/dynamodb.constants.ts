export const DYNAMODB_CLIENT = 'DYNAMODB_CLIENT';
export const DYNAMODB_DOCUMENT_CLIENT = 'DYNAMODB_DOCUMENT_CLIENT';

export const PATIENT_ENTITY_TYPES = {
    PROFILE: 'PROFILE',
    CONDITION_LOOKUP: 'CONDITION_LOOKUP',
    ADDRESS_LOOKUP: 'ADDRESS_LOOKUP',
} as const;

export const PATIENT_KEYS = {
    profilePk: (patientId: string) => `PATIENT#${patientId}`,
    profileSk: () => 'PROFILE',
    conditionPk: (condition: string) => `CONDITION#${condition}`,
    conditionSk: (patientId: string) => `PATIENT#${patientId}`,
    addressPk: (address: string) => `ADDRESS#${address}`,
    addressSk: (patientId: string) => `PATIENT#${patientId}`,
} as const;
