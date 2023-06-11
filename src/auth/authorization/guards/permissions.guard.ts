import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../factories/casl-ability.factory';
import { AppAbility, PolicyHandler, Subject } from '../types';
import { CHECK_POLICIES_KEY, PERMISSION_ENTITY_KEY } from '../decorators';
import { User } from '../../../users/entities';
import { everySeries } from 'p-iteration';
import { Request } from 'express';
import { Class } from 'type-fest';
import { BaseCaslAbilityFactory } from '../factories/base-casl-ability-factory';
import { Loaded } from '@mikro-orm/core';
import { Entity } from '../../../config/mikro-orm.config';
import { get } from 'lodash';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private caslAbilityFactory: CaslAbilityFactory,
    ) {}

    static async checkPermission(
        policyHandlers: PolicyHandler[],
        factory: Class<BaseCaslAbilityFactory> | CaslAbilityFactory,
        user: User,
        request?: Request,
        entity?: Subject | Loaded<Subject>,
    ) {
        if (!user) {
            throw new UnauthorizedException();
        }

        const factoryInstance =
            factory instanceof BaseCaslAbilityFactory ||
            factory instanceof CaslAbilityFactory
                ? factory
                : new factory();

        const ability: AppAbility = await (
            factoryInstance as any
        ).createForUser(user, request, entity);

        const result = await everySeries(
            policyHandlers,
            async (handler) =>
                await PermissionsGuard.execPolicyHandler(
                    handler,
                    ability,
                    user,
                ),
        );

        return result;
    }

    private static async execPolicyHandler(
        handler: PolicyHandler,
        ability: AppAbility,
        user: User,
    ) {
        if (typeof handler === 'function') {
            return handler(ability);
        } else if (typeof (handler as any).handle === 'function') {
            return (handler as any).handle(ability);
        } else if (typeof handler === 'string') {
            return user.hasPermission(handler);
        } else {
            throw new BadRequestException('Invalid policy handler');
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const user: User = (request as any)?.auth?.user;

        let entity: Entity | undefined;

        const policyHandlers =
            this.reflector.get<PolicyHandler[]>(
                CHECK_POLICIES_KEY,
                context.getHandler(),
            ) || [];
        const routeEntities = (request as any).entities;
        const permissionEntityKey = this.reflector.get<string | undefined>(
            PERMISSION_ENTITY_KEY,
            context.getHandler(),
        );
        if (permissionEntityKey) {
            entity = get(routeEntities, permissionEntityKey);
        }

        const result = await PermissionsGuard.checkPermission(
            policyHandlers,
            this.caslAbilityFactory,
            user,
            request,
            entity,
        );

        return result;
    }
}
