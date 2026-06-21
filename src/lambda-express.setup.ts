import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { configure as configureServerlessExpress } from '@codegenie/serverless-express';
import { Handler } from 'aws-lambda';
import express, { Express, NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

function parseApiGatewayBody(req: Request, _res: Response, next: NextFunction): void {
    const rawBody: unknown = req.body;

    if (rawBody == null || rawBody === '') {
        next();
        return;
    }

    if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
        next();
        return;
    }

    let text: string;
    if (Buffer.isBuffer(rawBody)) {
        if (rawBody.length === 0) {
            next();
            return;
        }
        text = rawBody.toString('utf8');
    } else if (typeof rawBody === 'string') {
        if (rawBody.trim().length === 0) {
            next();
            return;
        }
        text = rawBody;
    } else {
        next();
        return;
    }

    const contentType = String(req.headers['content-type'] ?? '');

    if (contentType.includes('application/json')) {
        try {
            req.body = JSON.parse(text) as Record<string, unknown>;
        } catch {
            req.body = text;
        }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        req.body = Object.fromEntries(new URLSearchParams(text)) as Record<string, string>;
    } else {
        req.body = text;
    }

    next();
}

export function configureLambdaExpress(expressApp: Express): void {
    // serverless-express sets req.body as a Buffer and marks the request complete,
    // so express.json() never runs. Parse the body here first.
    expressApp.use(parseApiGatewayBody);
    expressApp.use(express.json({ limit: '10mb' }));
    expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

export async function createLambdaHandler(): Promise<Handler> {
    const expressApp = express();
    configureLambdaExpress(expressApp);

    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { bodyParser: false });

    configureApp(nestApp);
    await nestApp.init();

    return configureServerlessExpress({
        app: expressApp,
        respondWithErrors: true,
        binarySettings: {
            contentTypes: ['application/octet-stream'],
        },
    });
}

export async function createLocalServer(): Promise<INestApplication> {
    const expressApp = express();
    configureLambdaExpress(expressApp);

    const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { bodyParser: false });

    configureApp(nestApp);
    await nestApp.init();

    return nestApp;
}
