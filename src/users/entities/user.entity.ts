import {
    Cascade,
    Collection,
    Entity,
    Loaded,
    ManyToMany,
    OneToMany,
    Property,
} from '@mikro-orm/core';
import { AccessToken, RefreshToken } from '../../auth/authentication/entities';
import { Post } from '../../posts/entities';
import { HashedId, hashidsSerializer } from '../../utils/hashids';
import { Permission, Role } from '../../auth/authorization/entities';
import { BaseEntity } from '../../database/entities';
import { Class } from 'type-fest';
import { BaseCaslAbilityFactory } from '../../auth/authorization/factories/base-casl-ability-factory';
import { Request } from 'express';
import {
    checkIfCan,
    checkIfCannot,
    doesAnyRoleHasPermission,
    PermissionsInputArgument,
} from '../../auth/authorization/helpers';
import { RouteKey } from '../../utils/route-entity-binding';
import { PhoneNumber } from '../phone-numbers/entities';
import { trim } from 'lodash';
import { Role as RoleEnum } from '../../auth/authorization/constants/role.enum';
import { PermissionType } from '../../config/auth';
import { Entity as EntityType } from '../../config/mikro-orm.config';
import { Email } from '../emails/entities';
import {Order} from "../../orders/entities/order.entity";

@Entity({ tableName: 'users' })
export class User extends BaseEntity<User, 'id'> {
    @HashedId()
    id: number;

    @RouteKey()
    @Property({
        unique: true,
    })
    username: string;

    @Property({ hidden: true })
    password: string;

    @Property({ nullable: true })
    firstName?: string;

    @Property({ nullable: true })
    lastName?: string;

    @ManyToMany({
        entity: 'Role',
        pivotEntity: 'UserHasRoles',
        serializer: hashidsSerializer,
        mappedBy: 'users',
        hidden: true,
    })
    roles: Collection<Role>;

    @ManyToMany({
        entity: 'Permission',
        pivotEntity: 'UserHasPermissions',
        serializer: hashidsSerializer,
        mappedBy: 'users',
        hidden: true,
    })
    permissions: Collection<Permission>;

    @OneToMany('Post', 'author', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    posts: Collection<Post> = new Collection<Post>(this);

    @OneToMany('RefreshToken', 'user', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    refreshTokens: Collection<RefreshToken> = new Collection<RefreshToken>(
        this,
    );

    @OneToMany('Order', 'user', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    order: Collection<Order> = new Collection<Order>(this);

    @OneToMany('AccessToken', 'user', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    accessTokens: Collection<AccessToken> = new Collection<AccessToken>(this);

    @OneToMany('Email', 'user', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    emails: Collection<Email> = new Collection<Email>(this);

    @OneToMany('PhoneNumber', 'user', {
        cascade: [Cascade.REMOVE],
        serializer: hashidsSerializer,
        hidden: true,
    })
    phoneNumbers: Collection<PhoneNumber> = new Collection<PhoneNumber>(this);

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;

    get fullName(): string {
        return trim(this.firstName + ' ' + this.lastName);
    }

    async hasRole(roleName: RoleEnum) {
        const roles = await this.roles.loadItems();
        return roles.some((role) => role.name === roleName);
    }

    async hasRolePermission(permissionName: PermissionType) {
        const roles = await this.roles.loadItems();
        const roleNames: RoleEnum[] = roles.map(
            (role) => role.name as RoleEnum,
        );
        const canExecuteWithRolePermission = doesAnyRoleHasPermission(
            roleNames,
            permissionName,
        );

        return canExecuteWithRolePermission;
    }

    async hasPersonalPermission(permissionName: PermissionType) {
        const permissions = await this.permissions.loadItems();

        const canExecuteWithPersonalPermission = permissions.some(
            (permission) => permission.name === permissionName,
        );

        return canExecuteWithPersonalPermission;
    }

    async hasPermission(permissionName: PermissionType) {
        const canExecuteWithRolePermission = await this.hasRolePermission(
            permissionName,
        );

        if (canExecuteWithRolePermission) return true;

        const canExecuteWithPersonalPermission =
            await this.hasPersonalPermission(permissionName);

        return canExecuteWithPersonalPermission;
    }

    async can<T extends Class<BaseCaslAbilityFactory>>(
        factory: T,
        entity?: InstanceType<EntityType> | Loaded<EntityType>,
        request?: Request,
        throwException = true,
        ...params: PermissionsInputArgument[]
    ) {
        return checkIfCan(
            factory,
            this,
            request,
            entity,
            throwException,
            ...params,
        );
    }

    async cannot<T extends Class<BaseCaslAbilityFactory>>(
        factory: T,
        entity?: InstanceType<EntityType> | Loaded<EntityType>,
        request?: Request,
        throwException = true,
        ...params: PermissionsInputArgument[]
    ) {
        return checkIfCannot(
            factory,
            this,
            request,
            entity,
            throwException,
            ...params,
        );
    }
}
