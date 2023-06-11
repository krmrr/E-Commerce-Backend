import { EntityRepository, expr, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UpdatePermissionDto, UpdateRoleDto } from './dto';
import { Permission, Role } from './entities';
import { User } from '../../users/entities';

interface FindAllRolesArgs {
    relations?: string[];
}

type FindOneRoleArgs =
    | string
    | (FindAllRolesArgs & {
          id?: number;
          name?: string;
      });

interface FindAllPermissionsArgs {
    relations?: string[];
}

type FindOnePermissionArgs =
    | string
    | (FindAllPermissionsArgs & {
          id?: number;
          name?: string;
      });

@Injectable()
export class AuthorizationService {
    constructor(
        @InjectRepository(User)
        private usersRepository: EntityRepository<User>,
        @InjectRepository(Role)
        private rolesRepository: EntityRepository<Role>,
        @InjectRepository(Permission)
        private permissionsRepository: EntityRepository<Permission>,
    ) {}

    async createRole(createRoleDto: Partial<Role>) {
        const role = this.rolesRepository.create(createRoleDto);
        await this.rolesRepository.persistAndFlush(role);
        return role;
    }

    findAllRoles(args?: FindAllRolesArgs) {
        const { relations } = args || {};
        return this.rolesRepository.find<any>({}, { populate: relations });
    }

    findOneRole(
        findOneRoleArgs: FindOneRoleArgs,
        throwNotFoundException: boolean = false,
    ) {
        let id, name, relations;
        if (typeof findOneRoleArgs === 'string') {
            name = findOneRoleArgs;
        } else {
            id = findOneRoleArgs.id;
            name = findOneRoleArgs.name;
            relations = findOneRoleArgs.relations;
        }

        let where: FilterQuery<Role> = {};

        if (id) {
            where = { id };
        } else if (name) {
            where = { [expr('lower(name)')]: name.toLowerCase() };
        } else {
            throw new BadRequestException('One of ID or name must be provided');
        }

        const role = this.rolesRepository.findOne(where, {
            populate: relations,
        });

        if (!role && throwNotFoundException) {
            throw new NotFoundException('Role not found');
        }
        return role;
    }

    async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
        const role = await this.rolesRepository.findOneOrFail(id);
        this.rolesRepository.assign(role, updateRoleDto);
        await this.rolesRepository.flush();
        return role;
    }

    async removeRole(id: number) {
        const role = await this.findOneRole({ id }, true);
        await this.rolesRepository.removeAndFlush(role);
        return true;
    }

    async createPermission(createPermissionDto: Partial<Permission>) {
        const permission =
            this.permissionsRepository.create(createPermissionDto);
        await this.permissionsRepository.persistAndFlush(permission);
        return permission;
    }

    findAllPermissions(args?: FindAllPermissionsArgs) {
        const { relations } = args || {};
        return this.permissionsRepository.find<any>(
            {},
            { populate: relations },
        );
    }

    findOnePermission(
        findOnePermissionArgs: FindOnePermissionArgs,
        throwNotFoundException: boolean = false,
    ) {
        let id, name, relations;
        if (typeof findOnePermissionArgs === 'string') {
            name = findOnePermissionArgs;
        } else {
            id = findOnePermissionArgs.id;
            name = findOnePermissionArgs.name;
            relations = findOnePermissionArgs.relations;
        }

        let where: FilterQuery<Permission> = {};

        if (id) {
            where = { id };
        } else if (name) {
            where = { [expr('lower(name)')]: name.toLowerCase() };
        } else {
            throw new BadRequestException('One of ID or name must be provided');
        }

        const permission = this.permissionsRepository.findOne(where, {
            populate: relations,
        });

        if (!permission && throwNotFoundException) {
            throw new NotFoundException('Permission not found');
        }
        return permission;
    }

    async updatePermission(
        id: number,
        updatePermissionDto: UpdatePermissionDto,
    ) {
        const permission = await this.permissionsRepository.findOneOrFail(id);
        this.permissionsRepository.assign(permission, updatePermissionDto);
        await this.permissionsRepository.flush();
        return permission;
    }

    async removePermission(id: number) {
        const permission = await this.findOnePermission({ id }, true);
        await this.permissionsRepository.removeAndFlush(permission);
        return true;
    }

    async addRolesToUser(
        user: User,
        rolesParam: (Role | FindOneRoleArgs) | (Role | FindOneRoleArgs)[],
    ) {
        if (!Array.isArray(rolesParam)) {
            rolesParam = [rolesParam];
        }

        // iterate rolesParam with for loop and add each role to user
        for (const roleParam of rolesParam) {
            const role =
                roleParam instanceof Role
                    ? roleParam
                    : await this.findOneRole(roleParam);
            user.roles.add(role);
        }
        await this.usersRepository.persistAndFlush(user);

        return user;
    }

    async addPermissionsToUser(
        user: User,
        permissionsParam:
            | (Permission | FindOnePermissionArgs)
            | (Permission | FindOnePermissionArgs)[],
    ) {
        if (!Array.isArray(permissionsParam)) {
            permissionsParam = [permissionsParam];
        }

        // iterate permissionsParam with for loop and add each permission to user
        for (const permissionParam of permissionsParam) {
            const permission =
                permissionParam instanceof Permission
                    ? permissionParam
                    : await this.findOnePermission(permissionParam);
            user.permissions.add(permission);
        }
        await this.usersRepository.persistAndFlush(user);

        return user;
    }

    async removeRolesFromUser(
        user: User,
        rolesParam: (Role | FindOneRoleArgs) | (Role | FindOneRoleArgs)[],
    ) {
        if (!Array.isArray(rolesParam)) {
            rolesParam = [rolesParam];
        }

        // iterate rolesParam with for loop and remove each role from user
        for (const roleParam of rolesParam) {
            const role =
                roleParam instanceof Role
                    ? roleParam
                    : await this.findOneRole(roleParam);
            user.roles.remove(role);
        }
        await this.usersRepository.persistAndFlush(user);

        return user;
    }

    async removePermissionsFromUser(
        user: User,
        permissionsParam:
            | (Permission | FindOnePermissionArgs)
            | (Permission | FindOnePermissionArgs)[],
    ) {
        if (!Array.isArray(permissionsParam)) {
            permissionsParam = [permissionsParam];
        }

        // iterate permissionsParam with for loop and remove each permission from user
        for (const permissionParam of permissionsParam) {
            const permission =
                permissionParam instanceof Permission
                    ? permissionParam
                    : await this.findOnePermission(permissionParam);
            user.permissions.remove(permission);
        }
        await this.usersRepository.persistAndFlush(user);

        return user;
    }
}
