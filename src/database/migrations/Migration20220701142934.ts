import { Migration } from '@mikro-orm/migrations';

export class Migration20220701142934 extends Migration {
    async up(): Promise<void> {
        /* this.addSql('create table `countries` (`id` int unsigned not null auto_increment primary key, `name` varchar(100) not null, `iso3` char(3) null, `numeric_code` char(3) null, `iso2` char(2) null, `phonecode` varchar(255) null, `capital` varchar(255) null, `currency` varchar(255) null, `currency_name` varchar(255) null, `currency_symbol` varchar(255) null, `tld` varchar(255) null, `native` varchar(255) null, `region` varchar(255) null, `subregion` varchar(255) null, `timezones` text null, `translations` text null, `latitude` decimal(10,8) null, `longitude` decimal(11,8) null, `emoji` varchar(191) null, `emojiU` varchar(191) null, `created_at` datetime not null, `updated_at` datetime null, `flag` tinyint(1) not null default true, `wikiDataId` varchar(255) null) default character set utf8mb4 engine = InnoDB;');
     
         this.addSql('create table `states` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `country_id` varchar(255) not null, `country_code` char(2) not null, `fips_code` varchar(255) null, `iso2` varchar(255) null, `type` varchar(191) null, `latitude` decimal(10,8) null, `longitude` decimal(11,8) null, `created_at` datetime not null, `updated_at` datetime null, `flag` tinyint(1) not null default true, `wikiDataId` varchar(255) null) default character set utf8mb4 engine = InnoDB;');
         this.addSql('alter table `states` add index `country_region`(`country_id`);');
     
         this.addSql('create table `cities` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `state_id` varchar(255) not null, `state_code` varchar(255) not null, `country_id` varchar(255) not null, `country_code` char(2) not null, `latitude` decimal(10,8) not null, `longitude` decimal(11,8) not null, `created_at` datetime not null, `updated_at` datetime null, `flag` tinyint(1) not null default true, `wikiDataId` varchar(255) null) default character set utf8mb4 engine = InnoDB;');
         this.addSql('alter table `cities` add index `cities_test_ibfk_1`(`state_id`);');
         this.addSql('alter table `cities` add index `cities_test_ibfk_2`(`country_id`);');*/

        this.addSql(
            'create table `permissions` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `title` varchar(255) null, `description` varchar(255) null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `permissions` add unique `permissions_name_unique`(`name`);',
        );

        this.addSql(
            'create table `roles` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `title` varchar(255) null, `description` varchar(255) null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `roles` add unique `roles_name_unique`(`name`);',
        );

        this.addSql(
            'create table `users` (`id` int unsigned not null auto_increment primary key, `username` varchar(255) not null, `password` varchar(255) not null, `first_name` varchar(255) null, `last_name` varchar(255) null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );

        this.addSql(
            'alter table `users` add unique `users_username_unique`(`username`);',
        );

        this.addSql(
            'create table `posts` (`id` int unsigned not null auto_increment primary key, `title` varchar(255) not null, `body` varchar(255) not null, `author_id` int unsigned not null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `posts` add index `posts_author_id_index`(`author_id`);',
        );

        this.addSql(
            'create table `refresh_tokens` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null, `is_revoked` tinyint(1) not null, `consumes_count` int not null, `expires_at` datetime not null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `refresh_tokens` add index `refresh_tokens_user_id_index`(`user_id`);',
        );

        this.addSql(
            'create table `access_tokens` (`id` int unsigned not null auto_increment primary key, `user_id` int unsigned not null, `refresh_token_id` int unsigned null, `is_revoked` tinyint(1) not null, `expires_at` datetime not null, `created_at` datetime not null, `updated_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `access_tokens` add index `access_tokens_user_id_index`(`user_id`);',
        );
        this.addSql(
            'alter table `access_tokens` add index `access_tokens_refresh_token_id_index`(`refresh_token_id`);',
        );

        this.addSql(
            'create table `user_has_roles` (`role_id` int unsigned not null, `user_id` int unsigned not null, `created_at` datetime not null default CURRENT_TIMESTAMP, primary key (`role_id`, `user_id`)) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `user_has_roles` add index `user_has_roles_role_id_index`(`role_id`);',
        );
        this.addSql(
            'alter table `user_has_roles` add index `user_has_roles_user_id_index`(`user_id`);',
        );

        this.addSql(
            'create table `user_has_permissions` (`permission_id` int unsigned not null, `user_id` int unsigned not null, `created_at` datetime not null default CURRENT_TIMESTAMP, primary key (`permission_id`, `user_id`)) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `user_has_permissions` add index `user_has_permissions_permission_id_index`(`permission_id`);',
        );
        this.addSql(
            'alter table `user_has_permissions` add index `user_has_permissions_user_id_index`(`user_id`);',
        );

        /*this.addSql('alter table `states` add constraint `states_country_id_foreign` foreign key (`country_id`) references `countries` (`id`) on update cascade;');
    
        this.addSql('alter table `cities` add constraint `cities_state_id_foreign` foreign key (`state_id`) references `states` (`id`) on update cascade;');
        this.addSql('alter table `cities` add constraint `cities_country_id_foreign` foreign key (`country_id`) references `countries` (`id`) on update cascade;');*/

        this.addSql(
            'alter table `posts` add constraint `posts_author_id_foreign` foreign key (`author_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );

        this.addSql(
            'alter table `refresh_tokens` add constraint `refresh_tokens_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );

        this.addSql(
            'alter table `access_tokens` add constraint `access_tokens_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );
        this.addSql(
            'alter table `access_tokens` add constraint `access_tokens_refresh_token_id_foreign` foreign key (`refresh_token_id`) references `refresh_tokens` (`id`) on update cascade on delete set null;',
        );

        this.addSql(
            'alter table `user_has_roles` add constraint `user_has_roles_role_id_foreign` foreign key (`role_id`) references `roles` (`id`) on update cascade;',
        );
        this.addSql(
            'alter table `user_has_roles` add constraint `user_has_roles_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade;',
        );

        this.addSql(
            'alter table `user_has_permissions` add constraint `user_has_permissions_permission_id_foreign` foreign key (`permission_id`) references `permissions` (`id`) on update cascade;',
        );
        this.addSql(
            'alter table `user_has_permissions` add constraint `user_has_permissions_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on update cascade;',
        );
    }
}
