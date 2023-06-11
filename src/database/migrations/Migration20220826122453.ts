import { Migration } from '@mikro-orm/migrations';

export class Migration20220824124453 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            "create table `phone_numbers` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null, `country_id` mediumint(8) unsigned not null, `contact_name` varchar(255) not null, `e164format` varchar(15) not null, `national_format` varchar(32) not null, `international_format` varchar(32) not null, `type` enum('primary', 'secondary', 'business', 'emergency', 'other') not null, `genre` enum('mobile', 'landline') not null, `details` varchar(1024) null, `order` int unsigned null, `proximity` enum('self', 'friend', 'first_degree_relative', 'second_degree_relative', 'third_degree_relative') not null default 'self', `created_at` datetime not null, `updated_at` datetime null, `deleted_at` datetime null) default character set utf8mb4 engine = InnoDB;",
        );
        this.addSql(
            'alter table `phone_numbers` add index `phone_numbers_user_id_index`(`user_id`);',
        );
        this.addSql(
            'alter table `phone_numbers` add index `phone_numbers_country_id_index`(`country_id`);',
        );
        this.addSql(
            'alter table `phone_numbers` add constraint `phone_numbers_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );
        this.addSql(
            'alter table `phone_numbers` add constraint `phone_numbers_country_id_foreign` foreign key (`country_id`) references `countries` (`id`) on update cascade on delete CASCADE;',
        );
    }
}
