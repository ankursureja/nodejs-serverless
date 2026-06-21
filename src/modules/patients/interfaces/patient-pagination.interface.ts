import { Patient } from './patient.interface';

export interface PaginatedPatientsResult {
    items: Patient[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
