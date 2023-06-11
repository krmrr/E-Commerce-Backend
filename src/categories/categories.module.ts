import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Category } from './entities/category.entity';

@Module({
    controllers: [CategoriesController],
    providers: [CategoriesService],
    imports: [MikroOrmModule.forFeature([Category])],
    exports:[CategoriesService]
})
export class CategoriesModule {}
