import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../constants/roles.constants';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

        if (!requiredRoles?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const userGroups = request.user?.groups ?? [];

        const hasRole = requiredRoles.some((role) => userGroups.includes(role));

        if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}
