import { MySqlConnection } from '@mikro-orm/mysql';
import KnexMySql from 'knex/lib/dialects/mysql2';

MySqlConnection.prototype.connect = async function (this: MySqlConnection) {
    this['patchKnex']();
    this.client = this.createKnexClient(KnexMySql);
};
