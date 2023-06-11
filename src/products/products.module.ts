import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Product } from './entities/product.entity';
import { CategoriesModule } from '../categories/categories.module';
import {CategoriesService} from "../categories/categories.service";

@Module({
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
    imports: [
        MikroOrmModule.forFeature([Product]),
        forwardRef(() => CategoriesModule)
    ],
})
export class ProductsModule {}
