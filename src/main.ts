import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        configureApp(app);

        const port = process.env.PORT || 3000;
        await app.listen(port);

        console.log(`Server running on http://localhost:${port}`);
        console.log(`Swagger docs: http://localhost:${port}/api/docs`);
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

bootstrap().catch((error: unknown) => {
    console.error('Unhandled bootstrap error:', error);
    process.exit(1);
});
