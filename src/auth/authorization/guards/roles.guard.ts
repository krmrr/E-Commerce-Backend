import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role as RoleEnum } from '../constants';
import { ROLES_KEY } from '../decorators';
import { Loaded } from '@mikro-orm/core';
import { User } from '../../../users/entities';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiredRoles) {
            return true;
        }

        const request: Request = context.switchToHttp().getRequest();

        const user = (request as any)?.auth?.user as
            | Loaded<User, never>
            | undefined;
        if (!user) {
            throw new UnauthorizedException();
        }

        const roles = await user.roles?.loadItems({
            populate: ['name'],
        });
        const roleNames = roles?.map((role) => role.name);

        return requiredRoles.some((role) => roleNames?.includes(role));
    }
}
