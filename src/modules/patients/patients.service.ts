import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorHandler } from '../../common/utils/error-handler.util';
import { CreatePatientDto, ListPatientsQueryDto, UpdatePatientDto } from './dto/patient.dto';
import { PaginatedPatientsResult } from './interfaces/patient-pagination.interface';
import { Patient } from './interfaces/patient.interface';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
    constructor(private readonly patientsRepository: PatientsRepository) {}

    async create(createPatientDto: CreatePatientDto): Promise<Patient> {
        try {
            return await this.patientsRepository.create({
                name: createPatientDto.name,
                address: createPatientDto.address,
                conditions: createPatientDto.conditions,
                allergies: createPatientDto.allergies,
            });
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'creating patient record');
        }
    }

    async findAll(query: ListPatientsQueryDto): Promise<PaginatedPatientsResult> {
        try {
            const page = query.page ?? 1;
            const limit = query.limit ?? 20;
            return await this.patientsRepository.findAllPaginated(page, limit);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'fetching all patient records');
        }
    }

    async findOne(id: string): Promise<Patient> {
        try {
            const patient = await this.patientsRepository.findById(id);
            if (!patient) {
                throw new NotFoundException(`Patient with id ${id} not found`);
            }
            return patient;
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'fetching patient record');
        }
    }

    async findByAddress(address: string): Promise<Patient[]> {
        try {
            return await this.patientsRepository.findByAddress(address);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'fetching patients by address');
        }
    }

    async findByCondition(condition: string): Promise<Patient[]> {
        try {
            return await this.patientsRepository.findByCondition(condition);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'fetching patients by condition');
        }
    }

    async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
        try {
            const patient = await this.patientsRepository.update(id, updatePatientDto);
            if (!patient) {
                throw new NotFoundException(`Patient with id ${id} not found`);
            }

            return patient;
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'updating patient record');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            const deleted = await this.patientsRepository.delete(id);
            if (!deleted) {
                throw new NotFoundException(`Patient with id ${id} not found`);
            }
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'deleting patient record');
        }
    }
}
