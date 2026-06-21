import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

export function configureApp(app: INestApplication): void {
    app.setGlobalPrefix('api');

    app.enableVersioning({
        type: VersioningType.URI,
    });

    app.enableCors({
        origin: true,
        credentials: true,
    });

    app.use(helmet());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    if (process.env.ENABLE_SWAGGER !== 'false') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('Apotec Patient API')
            .setDescription('Patient CRUD and query API backed by DynamoDB')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, swaggerDocument, {
            jsonDocumentUrl: '/api/swagger.json',
        });
    }
}
