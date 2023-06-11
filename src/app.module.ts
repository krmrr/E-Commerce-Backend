import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './config/mikro-orm.config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WorldModule } from './world/world.module';
import { MediaLibraryModule } from './media-library/media-library.module';
import { VerificationCodesModule } from './verification-codes/verification-codes.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { UrlGeneratorModule } from 'nestjs-url-generator';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        MikroOrmModule.forRoot(mikroOrmConfig),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => config.get('throttler'),
        }),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => config.get('mailer'),
        }),
        UrlGeneratorModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => config.get('urlGenerator'),
        }),
        UsersModule,
        MediaLibraryModule,
        AuthModule,
        WorldModule,
        VerificationCodesModule,
        ProductsModule,
        CategoriesModule,
        OrdersModule,
        PaymentModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
