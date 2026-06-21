import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from '../../common/utils/error-handler.util';
import { PATIENT_DELETE_ROLES, PATIENT_READ_ROLES, PATIENT_WRITE_ROLES } from '../../common/constants/roles.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CognitoAuthGuard } from '../../common/guards/cognito-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
    CreatePatientDto,
    ListPatientsQueryDto,
    PaginatedPatientsResponseDto,
    PatientResponseDto,
    SearchByAddressQueryDto,
    SearchByConditionQueryDto,
    UpdatePatientDto,
} from './dto/patient.dto';
import { PaginatedPatientsResult } from './interfaces/patient-pagination.interface';
import { Patient } from './interfaces/patient.interface';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(CognitoAuthGuard, RolesGuard)
@Controller({ path: 'patients', version: '1' })
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) {}

    @Post()
    @Roles(...PATIENT_WRITE_ROLES)
    @ApiOperation({ summary: 'Create a patient record' })
    @ApiCreatedResponse({ type: PatientResponseDto })
    async createPatientAction(@Body() createPatientDto: CreatePatientDto): Promise<Patient> {
        try {
            return await this.patientsService.create(createPatientDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'creating patient');
        }
    }

    @Get()
    @Roles(...PATIENT_READ_ROLES)
    @ApiOperation({ summary: 'List patient records with page-based pagination' })
    @ApiOkResponse({ type: PaginatedPatientsResponseDto })
    async findAllAction(@Query() query: ListPatientsQueryDto): Promise<PaginatedPatientsResult> {
        try {
            return await this.patientsService.findAll(query);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'listing patients');
        }
    }

    @Get('search/by-address')
    @Roles(...PATIENT_READ_ROLES)
    @ApiOperation({ summary: 'Find patients by address' })
    @ApiOkResponse({ type: PatientResponseDto, isArray: true })
    async findByAddressAction(@Query() SearchByAddressQueryDto: SearchByAddressQueryDto): Promise<Patient[]> {
        try {
            return await this.patientsService.findByAddress(SearchByAddressQueryDto.address);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'searching patients by address');
        }
    }

    @Get('search/by-condition')
    @Roles(...PATIENT_READ_ROLES)
    @ApiOperation({ summary: 'Find patients by medical condition' })
    @ApiOkResponse({ type: PatientResponseDto, isArray: true })
    async findByConditionAction(@Query() SearchByConditionQueryDto: SearchByConditionQueryDto): Promise<Patient[]> {
        try {
            return await this.patientsService.findByCondition(SearchByConditionQueryDto.condition);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'searching patients by condition');
        }
    }

    @Get(':id')
    @Roles(...PATIENT_READ_ROLES)
    @ApiOperation({ summary: 'Get a patient record by ID' })
    @ApiOkResponse({ type: PatientResponseDto })
    async findOneAction(@Param('id', ParseUUIDPipe) id: string): Promise<Patient> {
        try {
            return await this.patientsService.findOne(id);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'fetching patient');
        }
    }

    @Patch(':id')
    @Roles(...PATIENT_WRITE_ROLES)
    @ApiOperation({ summary: 'Update a patient record' })
    @ApiOkResponse({ type: PatientResponseDto })
    async updatePatientAction(@Param('id', ParseUUIDPipe) id: string, @Body() updatePatientDto: UpdatePatientDto): Promise<Patient> {
        try {
            return await this.patientsService.update(id, updatePatientDto);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'updating patient');
        }
    }

    @Delete(':id')
    @Roles(...PATIENT_DELETE_ROLES)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a patient record' })
    @ApiNoContentResponse()
    async removePatientAction(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        try {
            await this.patientsService.remove(id);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'deleting patient');
        }
    }
}
