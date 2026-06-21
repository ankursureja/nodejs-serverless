export interface Patient {
    id: string;
    name: string;
    address: string;
    conditions: string[];
    allergies: string[];
    createdAt: string;
    updatedAt: string;
}

export interface PatientProfileRecord extends Patient {
    pk: string;
    sk: string;
    entityType: 'PROFILE';
}

export interface ConditionLookupRecord {
    pk: string;
    sk: string;
    entityType: 'CONDITION_LOOKUP';
    patientId: string;
    condition: string;
}

export interface AddressLookupRecord {
    pk: string;
    sk: string;
    entityType: 'ADDRESS_LOOKUP';
    patientId: string;
    address: string;
}
