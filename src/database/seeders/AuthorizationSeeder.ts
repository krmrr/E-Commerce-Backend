import { Seeder } from '@mikro-orm/seeder';
import { Permission, Role } from '../../auth/authorization/entities';
import { Role as RoleEnum } from '../../auth/authorization/constants';
import { SqlEntityManager } from '@mikro-orm/knex';
import { allPermissionValues } from '../../config/auth';

export class AuthorizationSeeder extends Seeder {
    async run(em: SqlEntityManager): Promise<void> {
        for (const roleString of Object.values(RoleEnum)) {
            const isExist =
                (await Role.repository(undefined, em).count({
                    name: roleString,
                })) > 0;
            if (!isExist) {
                em.create(Role, {
                    name: roleString,
                });
            }
        }

        for (const permissionString of allPermissionValues) {
            const isExist =
                (await Permission.repository(undefined, em).count({
                    name: permissionString,
                })) > 0;
            if (!isExist) {
                em.create(Permission, {
                    name: permissionString,
                });
            }
        }
    }
}
