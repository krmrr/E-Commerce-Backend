import { BaseCaslAbilityFactory } from '../factories/base-casl-ability-factory';
import { User } from '../../../users/entities';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { Class } from 'type-fest';
import { Subject } from '../types';
import {
    createPolicyHandlers,
    PermissionsInputArgument,
} from './create-policy-handlers';
import { PermissionsGuard } from '../guards';
import { Loaded } from '@mikro-orm/core';
import { Role } from '../constants';
import { PermissionType, rolePermissions } from '../../../config/auth';
import { Entity } from '../../../config/mikro-orm.config';

export async function checkPermission<T extends Class<BaseCaslAbilityFactory>>(
    factory: T,
    user: User,
    request?: Request,
    entity?: Subject | Loaded<Subject>,
    defaultCondition: 'can' | 'cannot' = 'can',
    throwException = true,
    ...params: PermissionsInputArgument[]
) {
    const defaults = {
        defaultCondition,
        defaultSubject: entity.constructor as any,
    };
    const policyHandlers = createPolicyHandlers(params, defaults);
    const pass = await PermissionsGuard.checkPermission(
        policyHandlers,
        factory,
        user,
        request,
        entity,
    );

    if (throwException && !pass) {
        throw new UnauthorizedException();
    }

    return pass;
}

export async function checkIfCan<T extends Class<BaseCaslAbilityFactory>>(
    factory: T,
    user: User,
    request?: Request,
    entity?: InstanceType<Entity> | Loaded<Entity>,
    throwException = true,
    ...params: PermissionsInputArgument[]
) {
    return checkPermission(
        factory,
        user,
        request,
        entity,
        'can',
        throwException,
        ...params,
    );
}

export async function checkIfCannot<T extends Class<BaseCaslAbilityFactory>>(
    factory: T,
    user: User,
    request?: Request,
    entity?: InstanceType<Entity> | Loaded<Entity>,
    throwException = true,
    ...params: PermissionsInputArgument[]
) {
    return checkPermission(
        factory,
        user,
        request,
        entity,
        'can',
        throwException,
        ...params,
    );
}

export function doesRoleHasPermission(role: Role, permission: PermissionType) {
    return rolePermissions[role]?.includes(permission) ?? false;
}

export function doesAnyRoleHasPermission(
    roles: Role[],
    permission: PermissionType,
) {
    for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const roleHasPermission = doesRoleHasPermission(role, permission);
        if (roleHasPermission) return true;
    }
    return false;
}
