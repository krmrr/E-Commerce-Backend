import { Migration } from '@mikro-orm/migrations';

export class Migration20230607084448 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `products` modify `currency` enum(\'₺\', \'$\', \'€\', \'gbp\') not null;');

    this.addSql('alter table `orders` modify `amount_currency` enum(\'₺\', \'$\', \'€\', \'gbp\') not null, modify `payment_status` varchar(255) default \'Unsuccessful\';');
  }

  async down(): Promise<void> {
    this.addSql('alter table `products` modify `currency` enum(\'₺\', \'$\', \'€\') not null;');

    this.addSql('alter table `orders` modify `amount_currency` enum(\'₺\', \'$\', \'€\') not null, modify `payment_status` varchar(255);');
  }

}
