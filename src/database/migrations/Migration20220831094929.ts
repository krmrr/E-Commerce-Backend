import { Migration } from '@mikro-orm/migrations';

export class Migration20220831094929 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            "create table `verification_codes` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null, `target_entity_type` varchar(64) not null, `target_entity_id` int not null, `event` varchar(128) not null, `channel_type` enum('email', 'sms') null, `payload` varchar(1024) null, `code` varchar(12) not null, `is_invalidated` tinyint(1) not null default false, `used_at` datetime null, `expires_at` datetime not null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;",
        );
        this.addSql(
            'alter table `verification_codes` add index `verification_codes_user_id_index`(`user_id`);',
        );
        this.addSql(
            'alter table `verification_codes` add constraint `verification_codes_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );
    }
}
