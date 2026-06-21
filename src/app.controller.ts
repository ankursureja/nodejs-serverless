import { Controller, Get } from '@nestjs/common';
import { ErrorHandler } from './common/utils/error-handler.util';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        try {
            return this.appService.getHello();
        } catch (error: unknown) {
            ErrorHandler.handle(error, 'fetching health message');
        }
    }
}
