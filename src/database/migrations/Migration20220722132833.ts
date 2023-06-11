import { Migration } from '@mikro-orm/migrations';

export class Migration20220722132833 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            'create table `media` (`id` int unsigned not null auto_increment primary key, `uploader_id` int unsigned null, `model_type` varchar(255) null, `model_id` int unsigned null, `collection_name` varchar(255) null, `name` varchar(255) null, `description` varchar(2048) null, `extension` varchar(255) not null, `file_name` varchar(255) not null, `directory` varchar(255) not null, `mime_type` varchar(255) not null, `disk` varchar(255) not null, `conversions_disk` varchar(255) null, `size` int unsigned not null, `manipulations` json null, `generated_conversions` json null, `responsive_images` json null, `order` int unsigned null, `created_at` datetime not null, `updated_at` datetime null, `deleted_at` datetime null) default character set utf8mb4 engine = InnoDB;',
        );
        this.addSql(
            'alter table `media` add index `media_uploader_id_index`(`uploader_id`);',
        );

        this.addSql(
            'alter table `media` add constraint `media_uploader_id_foreign` foreign key (`uploader_id`) references `users` (`id`) on update cascade on delete CASCADE;',
        );
    }
}
