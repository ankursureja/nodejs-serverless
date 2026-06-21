import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreatePatientDto {
    @ApiProperty({ example: 'Jane Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '123 Main St, Springfield, IL 62701' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ example: ['Hypertension', 'Asthma'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    conditions: string[];

    @ApiProperty({ example: ['Penicillin', 'Peanuts'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    allergies: string[];
}

export class UpdatePatientDto {
    @ApiProperty({ example: 'Jane Doe', required: false })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({
        example: '456 Oak Ave, Springfield, IL 62701',
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    address?: string;

    @ApiProperty({ example: ['Hypertension'], type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    conditions?: string[];

    @ApiProperty({ example: ['Penicillin'], type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergies?: string[];
}

export class PatientResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    @IsUUID()
    id: string;

    @ApiProperty({ example: 'Jane Doe' })
    name: string;

    @ApiProperty({ example: '123 Main St, Springfield, IL 62701' })
    address: string;

    @ApiProperty({ example: ['Hypertension', 'Asthma'], type: [String] })
    conditions: string[];

    @ApiProperty({ example: ['Penicillin', 'Peanuts'], type: [String] })
    allergies: string[];

    @ApiProperty()
    createdAt: string;

    @ApiProperty()
    updatedAt: string;
}

export class ListPatientsQueryDto {
    @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

export class PaginatedPatientsResponseDto {
    @ApiProperty({ type: PatientResponseDto, isArray: true })
    items: PatientResponseDto[];

    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 42 })
    total: number;

    @ApiProperty({ example: 3 })
    totalPages: number;
}

export class SearchByAddressQueryDto {
    @ApiProperty({
        example: 'Junagadh',
        description:
            'Address search term. Matches full address, city/area segments, or partial text (e.g. "junagadh" matches "Nava Nagar, Junagadh").',
    })
    @IsString()
    @IsNotEmpty()
    address: string;
}

export class SearchByConditionQueryDto {
    @ApiProperty({ example: 'Hypertension' })
    @IsString()
    @IsNotEmpty()
    condition: string;
}

export class OpenSearchConditionQueryDto extends SearchByConditionQueryDto {
    @ApiProperty({ example: 0, required: false, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    from?: number;

    @ApiProperty({ example: 20, required: false, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    size?: number;
}

export class PatientSearchResponseDto {
    @ApiProperty()
    total: number;

    @ApiProperty({ type: PatientResponseDto, isArray: true })
    patients: PatientResponseDto[];
}
