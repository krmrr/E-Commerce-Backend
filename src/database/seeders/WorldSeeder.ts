import { Seeder } from '@mikro-orm/seeder';
import fs from 'fs-extra';
import { join } from 'path';
import { getAbsolutePath } from '../../helpers/filesystem';
import { SqlEntityManager } from '@mikro-orm/knex';

export class WorldSeeder extends Seeder {
    async run(em: SqlEntityManager): Promise<void> {
        const world = fs
            .readFileSync(
                getAbsolutePath(join('/src/database/dumps', 'world.sql')),
            )
            .toString();
        await em
            .getConnection()
            .execute('SET GLOBAL max_allowed_packet=104857600104857600;');
        await em.getConnection().execute(world.toString());
    }
}
