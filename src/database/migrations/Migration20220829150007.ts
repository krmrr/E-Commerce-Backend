import { Migration } from '@mikro-orm/migrations';

export class Migration20220829150007 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            "create table `emails` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null, `address` varchar(255) not null, `type` enum('primary', 'secondary', 'internal', 'other') not null, `details` varchar(1024) null, `order` int unsigned null, `confirmed_at` datetime null, `created_at` datetime not null, `updated_at` datetime null, `deleted_at` datetime null) default character set utf8mb4 engine = InnoDB;",
        );
        this.addSql(
            'alter table `emails` add index `emails_user_id_index`(`user_id`);',
        );

        this.addSql(
            'alter table `emails` add constraint `emails_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );
    }
}
