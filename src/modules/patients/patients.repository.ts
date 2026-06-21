import { Injectable } from '@nestjs/common';
import { GetCommand, QueryCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { randomUUID } from 'crypto';
import { ErrorHandler } from '../../common/utils/error-handler.util';
import { DynamoDbService } from '../../dynamodb/dynamodb.service';
import { PATIENT_ENTITY_TYPES, PATIENT_KEYS } from '../../dynamodb/dynamodb.constants';
import { AddressLookupRecord, ConditionLookupRecord, Patient, PatientProfileRecord } from './interfaces/patient.interface';
import { normalizeLookupValue, extractAddressTokens, addressMatchesSearch } from './utils/normalize.util';
import { PaginatedPatientsResult } from './interfaces/patient-pagination.interface';

@Injectable()
export class PatientsRepository {
    constructor(private readonly dynamoDb: DynamoDbService) {}

    async create(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
        try {
            const now = new Date().toISOString();
            const patient: Patient = {
                id: randomUUID(),
                ...data,
                createdAt: now,
                updatedAt: now,
            };

            const profileRecord = this.toProfileRecord(patient);
            const conditionRecords = this.toConditionRecords(patient);
            const addressRecords = this.toAddressRecords(patient);

            await this.dynamoDb.client.send(
                new TransactWriteCommand({
                    TransactItems: [
                        {
                            Put: {
                                TableName: this.dynamoDb.tableName,
                                Item: profileRecord,
                                ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
                            },
                        },
                        ...addressRecords.map((record) => ({
                            Put: {
                                TableName: this.dynamoDb.tableName,
                                Item: record,
                                ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
                            },
                        })),
                        ...conditionRecords.map((record) => ({
                            Put: {
                                TableName: this.dynamoDb.tableName,
                                Item: record,
                                ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
                            },
                        })),
                    ],
                })
            );

            return patient;
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'persisting patient to DynamoDB');
        }
    }

    async findById(id: string): Promise<Patient | null> {
        try {
            const result = await this.dynamoDb.client.send(
                new GetCommand({
                    TableName: this.dynamoDb.tableName,
                    Key: {
                        pk: PATIENT_KEYS.profilePk(id),
                        sk: PATIENT_KEYS.profileSk(),
                    },
                })
            );

            if (!result.Item) {
                return null;
            }

            return this.fromProfileRecord(result.Item as PatientProfileRecord);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'reading patient from DynamoDB');
        }
    }

    async findAllPaginated(page: number, limit: number): Promise<PaginatedPatientsResult> {
        try {
            const offset = (page - 1) * limit;
            const items: Patient[] = [];
            let total = 0;
            let lastEvaluatedKey: Record<string, NativeAttributeValue> | undefined;

            do {
                const result = await this.dynamoDb.client.send(
                    new ScanCommand({
                        TableName: this.dynamoDb.tableName,
                        FilterExpression: 'entityType = :entityType',
                        ExpressionAttributeValues: {
                            ':entityType': PATIENT_ENTITY_TYPES.PROFILE,
                        },
                        ExclusiveStartKey: lastEvaluatedKey,
                    })
                );

                for (const item of result.Items ?? []) {
                    if (total >= offset && items.length < limit) {
                        items.push(this.fromProfileRecord(item as PatientProfileRecord));
                    }
                    total++;
                }

                lastEvaluatedKey = result.LastEvaluatedKey;
            } while (lastEvaluatedKey);

            const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

            return {
                items,
                page,
                limit,
                total,
                totalPages,
            };
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'scanning patients in DynamoDB');
        }
    }

    async findByAddress(address: string): Promise<Patient[]> {
        try {
            const normalizedAddress = normalizeLookupValue(address);

            const lookupResult = await this.dynamoDb.client.send(
                new QueryCommand({
                    TableName: this.dynamoDb.tableName,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
                    ExpressionAttributeValues: {
                        ':pk': PATIENT_KEYS.addressPk(normalizedAddress),
                        ':skPrefix': 'PATIENT#',
                    },
                })
            );

            const patientIds = (lookupResult.Items ?? []).map((item) => (item as AddressLookupRecord).patientId);

            if (patientIds.length > 0) {
                const patients = await Promise.all(patientIds.map((patientId) => this.findById(patientId)));

                return patients.filter((patient): patient is Patient => patient !== null);
            }

            return this.findByAddressPartial(normalizedAddress);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'querying patients by address in DynamoDB');
        }
    }

    private async findByAddressPartial(searchTerm: string): Promise<Patient[]> {
        const patients: Patient[] = [];
        let lastEvaluatedKey: Record<string, NativeAttributeValue> | undefined;

        do {
            const result = await this.dynamoDb.client.send(
                new ScanCommand({
                    TableName: this.dynamoDb.tableName,
                    FilterExpression: 'entityType = :entityType',
                    ExpressionAttributeValues: {
                        ':entityType': PATIENT_ENTITY_TYPES.PROFILE,
                    },
                    ExclusiveStartKey: lastEvaluatedKey,
                })
            );

            for (const item of result.Items ?? []) {
                const patient = this.fromProfileRecord(item as PatientProfileRecord);
                if (addressMatchesSearch(patient.address, searchTerm)) {
                    patients.push(patient);
                }
            }

            lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        return patients;
    }

    async findByCondition(condition: string): Promise<Patient[]> {
        try {
            const normalizedCondition = normalizeLookupValue(condition);

            const lookupResult = await this.dynamoDb.client.send(
                new QueryCommand({
                    TableName: this.dynamoDb.tableName,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
                    ExpressionAttributeValues: {
                        ':pk': PATIENT_KEYS.conditionPk(normalizedCondition),
                        ':skPrefix': 'PATIENT#',
                    },
                })
            );

            const patientIds = (lookupResult.Items ?? []).map((item) => (item as ConditionLookupRecord).patientId);

            const patients = await Promise.all(patientIds.map((patientId) => this.findById(patientId)));

            return patients.filter((patient): patient is Patient => patient !== null);
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'querying patients by condition in DynamoDB');
        }
    }

    async update(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Patient | null> {
        try {
            const existing = await this.findById(id);
            if (!existing) {
                return null;
            }

            const updated: Patient = {
                ...existing,
                ...data,
                updatedAt: new Date().toISOString(),
            };

            const oldConditions = new Set(existing.conditions.map((condition) => normalizeLookupValue(condition)));
            const newConditions = new Set(updated.conditions.map((condition) => normalizeLookupValue(condition)));

            const conditionsToDelete = [...oldConditions].filter((condition) => !newConditions.has(condition));
            const conditionsToAdd = [...newConditions].filter((condition) => !oldConditions.has(condition));

            const oldAddressTokens = extractAddressTokens(existing.address);
            const newAddressTokens = extractAddressTokens(updated.address);
            const addressChanged = normalizeLookupValue(existing.address) !== normalizeLookupValue(updated.address);

            const addressTokensToDelete = addressChanged ? oldAddressTokens.filter((token) => !newAddressTokens.includes(token)) : [];
            const addressTokensToAdd = addressChanged ? newAddressTokens.filter((token) => !oldAddressTokens.includes(token)) : [];

            const transactItems = [
                {
                    Put: {
                        TableName: this.dynamoDb.tableName,
                        Item: this.toProfileRecord(updated),
                    },
                },
                ...addressTokensToDelete.map((token) => ({
                    Delete: {
                        TableName: this.dynamoDb.tableName,
                        Key: {
                            pk: PATIENT_KEYS.addressPk(token),
                            sk: PATIENT_KEYS.addressSk(id),
                        },
                    },
                })),
                ...addressTokensToAdd.map((token) => ({
                    Put: {
                        TableName: this.dynamoDb.tableName,
                        Item: {
                            pk: PATIENT_KEYS.addressPk(token),
                            sk: PATIENT_KEYS.addressSk(id),
                            entityType: PATIENT_ENTITY_TYPES.ADDRESS_LOOKUP,
                            patientId: id,
                            address: token,
                        } satisfies AddressLookupRecord,
                    },
                })),
                ...conditionsToDelete.map((condition) => ({
                    Delete: {
                        TableName: this.dynamoDb.tableName,
                        Key: {
                            pk: PATIENT_KEYS.conditionPk(condition),
                            sk: PATIENT_KEYS.conditionSk(id),
                        },
                    },
                })),
                ...conditionsToAdd.map((condition) => ({
                    Put: {
                        TableName: this.dynamoDb.tableName,
                        Item: {
                            pk: PATIENT_KEYS.conditionPk(condition),
                            sk: PATIENT_KEYS.conditionSk(id),
                            entityType: PATIENT_ENTITY_TYPES.CONDITION_LOOKUP,
                            patientId: id,
                            condition,
                        } satisfies ConditionLookupRecord,
                    },
                })),
            ];

            await this.dynamoDb.client.send(new TransactWriteCommand({ TransactItems: transactItems }));

            return updated;
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'updating patient in DynamoDB');
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const existing = await this.findById(id);
            if (!existing) {
                return false;
            }

            const transactItems = [
                {
                    Delete: {
                        TableName: this.dynamoDb.tableName,
                        Key: {
                            pk: PATIENT_KEYS.profilePk(id),
                            sk: PATIENT_KEYS.profileSk(),
                        },
                    },
                },
                ...extractAddressTokens(existing.address).map((token) => ({
                    Delete: {
                        TableName: this.dynamoDb.tableName,
                        Key: {
                            pk: PATIENT_KEYS.addressPk(token),
                            sk: PATIENT_KEYS.addressSk(id),
                        },
                    },
                })),
                ...existing.conditions.map((condition) => ({
                    Delete: {
                        TableName: this.dynamoDb.tableName,
                        Key: {
                            pk: PATIENT_KEYS.conditionPk(normalizeLookupValue(condition)),
                            sk: PATIENT_KEYS.conditionSk(id),
                        },
                    },
                })),
            ];

            await this.dynamoDb.client.send(new TransactWriteCommand({ TransactItems: transactItems }));

            return true;
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'deleting patient from DynamoDB');
        }
    }

    private toProfileRecord(patient: Patient): PatientProfileRecord {
        return {
            pk: PATIENT_KEYS.profilePk(patient.id),
            sk: PATIENT_KEYS.profileSk(),
            entityType: PATIENT_ENTITY_TYPES.PROFILE,
            id: patient.id,
            name: patient.name,
            address: patient.address,
            conditions: patient.conditions,
            allergies: patient.allergies,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
        };
    }

    private toAddressRecords(patient: Patient): AddressLookupRecord[] {
        return extractAddressTokens(patient.address).map((token) => ({
            pk: PATIENT_KEYS.addressPk(token),
            sk: PATIENT_KEYS.addressSk(patient.id),
            entityType: PATIENT_ENTITY_TYPES.ADDRESS_LOOKUP,
            patientId: patient.id,
            address: token,
        }));
    }

    private toConditionRecords(patient: Patient): ConditionLookupRecord[] {
        return patient.conditions.map((condition) => ({
            pk: PATIENT_KEYS.conditionPk(normalizeLookupValue(condition)),
            sk: PATIENT_KEYS.conditionSk(patient.id),
            entityType: PATIENT_ENTITY_TYPES.CONDITION_LOOKUP,
            patientId: patient.id,
            condition: normalizeLookupValue(condition),
        }));
    }

    private fromProfileRecord(record: PatientProfileRecord): Patient {
        return {
            id: record.id,
            name: record.name,
            address: record.address,
            conditions: record.conditions,
            allergies: record.allergies,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
}
