import { Migration } from '@mikro-orm/migrations';

export class Migration20230529120826 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `categories` (`id` int unsigned not null auto_increment primary key, `title` varchar(256) not null, `slug` varchar(450) not null, `visibility` boolean not null, `created_at` datetime not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('create table `products` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `slug` varchar(255) not null, `amount` int not null, `category_id` int unsigned not null, `description` text not null, `image_url` json null, `features` json null, `price` float not null, `currency` enum(\'₺\', \'$\', \'€\') not null, `sale_statu` boolean not null, `created_at` datetime not null, `deleted_at` datetime null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `products` add index `products_category_id_index`(`category_id`);');

    this.addSql('create table `orders` (`id` int unsigned not null auto_increment primary key, `order_name` varchar(255) not null, `selected_features` json null, `product_id` int unsigned not null, `user_id` int unsigned not null, `category_id` int unsigned not null, `amount_paid` int not null, `amount_currency` enum(\'₺\', \'$\', \'€\') not null, `country_name` varchar(255) not null, `city_name` varchar(255) not null, `state_name` varchar(255) not null, `full_address` varchar(255) not null, `phone_number` varchar(255) not null, `payment_status` varchar(255) null, `payment_data` json null, `payment_code` int null, `all_complated` tinyint(1) not null default false, `created_at` datetime not null, `cancel_at` datetime null, `deleted_at` datetime null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `orders` add index `orders_product_id_index`(`product_id`);');
    this.addSql('alter table `orders` add index `orders_user_id_index`(`user_id`);');
    this.addSql('alter table `orders` add index `orders_category_id_index`(`category_id`);');

    this.addSql('alter table `products` add constraint `products_category_id_foreign` foreign key (`category_id`) references `categories` (`id`) on update cascade on delete CASCADE;');

    this.addSql('alter table `orders` add constraint `orders_product_id_foreign` foreign key (`product_id`) references `products` (`id`) on update cascade on delete CASCADE;');
    this.addSql('alter table `orders` add constraint `orders_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete CASCADE;');
    this.addSql('alter table `orders` add constraint `orders_category_id_foreign` foreign key (`category_id`) references `categories` (`id`) on update cascade on delete CASCADE;');
  }

}
