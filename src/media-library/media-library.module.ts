import { Module } from '@nestjs/common';
import { MediaLibraryService } from './media-library.service';
import { MediaLibraryController } from './media-library.controller';
import { StorageModule } from '@codebrew/nestjs-storage';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Media } from './entities';

@Module({
    imports: [
        ConfigModule,
        MikroOrmModule.forFeature([Media]),
        StorageModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => config.get('storage'),
        }),
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const configOptions = { ...config.get('multer') };
                if (configOptions.storage) {
                    configOptions.storage = diskStorage(configOptions.storage);
                }
                return configOptions;
            },
        }),
    ],
    controllers: [MediaLibraryController],
    providers: [MediaLibraryService, ConfigService],
    exports: [MediaLibraryService],
})
export class MediaLibraryModule {}
