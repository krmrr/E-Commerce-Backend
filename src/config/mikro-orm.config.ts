import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { Logger } from '@nestjs/common';
import { Options, ReflectMetadataProvider } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { env } from './environment';
import { AccessToken, RefreshToken } from '../auth/authentication/entities';
import { Post } from '../posts/entities';
import { User } from '../users/entities';
import {
    Permission,
    Role,
    UserHasPermissions,
    UserHasRoles,
} from '../auth/authorization/entities';
import { Country } from '../world/countries/entities';
import { State } from '../world/states/entities';
import { City } from '../world/cities/entities';
import { Media } from '../media-library/entities';
import { SortableHandlerSubscriber } from '../utils/sorting';
import { BaseRepository } from '../database/repositories';
import { PhoneNumber } from '../users/phone-numbers/entities';
import { Email } from '../users/emails/entities';
import { SoftDeletesSubscriber } from '../utils/soft-deletes/subscriber';
import { VerificationCode } from '../verification-codes/entities';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import {Order} from "../orders/entities/order.entity";

export const entities = {
    User,
    Post,
    AccessToken,
    RefreshToken,
    Role,
    Permission,
    UserHasRoles,
    UserHasPermissions,
    Country,
    State,
    City,
    Media,
    PhoneNumber,
    Email,
    VerificationCode,
    Product,
    Category,
    Order,
} as const;

export const entitiesArray = Object.values(entities);
// FIXME: Entity type is weird. Sometimes we need to use it with ValueOf (from type-fest) but i still didn't figured out why
export type Entity = typeof entitiesArray[number];
// FIXME: Also, ExtractedEntity is nonsense.
export type ExtractedEntity<T> = Extract<Entity, T>;

export function getEntityName(entity: Entity | InstanceType<Entity>) {
    let entityName = entity.constructor.name;

    if (!entityName || entityName === 'Function') {
        entityName = Object.keys(entities).find(
            (key) => entities[key].constructor === entity.constructor,
        );
    }

    return entityName;
}

export function getEntity(name: keyof typeof entities): Entity {
    return entities[name];
}

const logger = new Logger('MikroORM');

const config: Options = {
    name: 'default',
    /* entities: ['dist/!**!/!*.entity.js'],
   entitiesTs: ['src/!**!/!*.entity.ts'],*/
    entities: entitiesArray,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    dbName: env.DATABASE_NAME,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    type: env.DATABASE_CONNECTION as MikroOrmModuleSyncOptions['type'],
    debug: env.DATABASE_DEBUG,
    metadataProvider: ReflectMetadataProvider,
    highlighter: new SqlHighlighter(),
    logger: logger.log.bind(logger),
    multipleStatements: env.NODE_ENV !== 'production',
    migrations: {
        tableName: 'migrations', // name of database table with log of executed transactions
        path: './src/database/migrations', // path to the folder with migrations
        transactional: true, // wrap each migration in a transaction
        disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
        allOrNothing: true, // wrap all migrations in master transaction
        dropTables: true, // allow to disable table dropping
        safe: true, // allow to disable table and column dropping
        emit: 'ts', // migration generation mode
    },
    seeder: {
        path: './src/database/seeders', // path to the folder with seeders
        defaultSeeder: 'DatabaseSeeder', // default seeder class name
        glob: '!(*.d).{js,ts}', // how to match seeder files (all .js and .ts files, but not .d.ts)
        emit: 'ts', // seeder generation mode
        fileName: (className: string) => className, // seeder file naming convention
    },
    subscribers: [new SoftDeletesSubscriber(), new SortableHandlerSubscriber()],
    entityRepository: BaseRepository,
};

export default config;
