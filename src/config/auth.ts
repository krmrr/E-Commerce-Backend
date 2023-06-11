import { BaseCaslAbilityFactory } from '../auth/authorization/factories/base-casl-ability-factory';
import { Class } from 'type-fest';
import { PostCaslAbilityFactory } from '../posts/factories';
import { Entity, getEntityName } from './mikro-orm.config';
import { PhoneNumberCaslAbilityFactory } from '../users/phone-numbers/factories';
import { PhoneNumberPermission } from '../users/phone-numbers/constants';
import { Permission } from '../auth/authorization/constants';
import { flatten } from 'lodash';
import { phoneNumberRolePermissions } from '../users/phone-numbers/constants/role-permissions';
import merge from 'ts-deepmerge';
import { EmailCaslAbilityFactory } from '../users/emails/factories';
import { emailRolePermissions } from '../users/emails/constants/role-permissions';
import { EmailPermission } from '../users/emails/constants';
import {OrdersCaslAbilityFactory} from "../orders/factories/orders-casl-ability.factory";

export const entityAbilityFactories: {
    [entityName: string]: Class<BaseCaslAbilityFactory>;
} = {
    // Put entity ability factories here
    Post: PostCaslAbilityFactory,
    PhoneNumber: PhoneNumberCaslAbilityFactory,
    Email: EmailCaslAbilityFactory,
    Order: OrdersCaslAbilityFactory
};

export const entityPermissions = {
    // Put entity related permissions here
    PhoneNumber: [PhoneNumberPermission],
    Email: [EmailPermission],
};

export const rolePermissions = merge(
    ...[
        // Put role permissions objects here
        phoneNumberRolePermissions,
        emailRolePermissions,
    ],
);

// FIXME: automatically get types from allPermissionValues
// Put permissions here until types get fixed
export type EntityPermissionType = PhoneNumberPermission | EmailPermission;

// Do not touch anything below
export type PermissionType = Permission | EntityPermissionType;

export const abilityFactories: Class<BaseCaslAbilityFactory>[] = [
    ...Object.values(entityAbilityFactories),
];

const entityPermissionEnums = flatten<EntityPermissionType>(
    // @ts-ignore
    Object.values(entityPermissions),
);
export const allPermissionEnums: PermissionType[] = [
    // @ts-ignore
    Permission,
    ...entityPermissionEnums,
];
export const allPermissionValues: string[] = flatten(
    allPermissionEnums.map((permissionEnum) => Object.values(permissionEnum)),
);

export function getEntityAbilityFactory(
    entity: Entity,
): Class<BaseCaslAbilityFactory> {
    const entityName = getEntityName(entity);
    return entityAbilityFactories[entityName];
}
