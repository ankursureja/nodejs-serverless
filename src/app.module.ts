import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import dynamodbConfig from './config/dynamodb.config';
import { DynamoDbModule } from './dynamodb/dynamodb.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, dynamodbConfig],
        }),
        DynamoDbModule,
        AuthModule,
        PatientsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
