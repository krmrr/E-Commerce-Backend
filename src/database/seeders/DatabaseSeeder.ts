import { Seeder } from '@mikro-orm/seeder';
import { AuthorizationSeeder } from './AuthorizationSeeder';
import { WorldSeeder } from './WorldSeeder';
import { SqlEntityManager } from '@mikro-orm/knex';

export class DatabaseSeeder extends Seeder {
    async run(em: SqlEntityManager): Promise<void> {
        //await new WorldSeeder().run(em);
        await new AuthorizationSeeder().run(em);
    }
}
