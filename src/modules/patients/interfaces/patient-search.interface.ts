import { Patient } from './patient.interface';

export interface PatientSearchDocument {
    id: string;
    name: string;
    address: string;
    conditions: string[];
    conditionsNormalized: string[];
    conditionsText: string;
    allergies: string[];
    createdAt: string;
    updatedAt: string;
}

export interface PatientSearchResult {
    total: number;
    patients: Patient[];
}
