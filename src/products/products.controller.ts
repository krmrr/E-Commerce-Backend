import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { CreateProductBodyDto } from './dto/create-product.body.dto';
import { Category } from '../categories/entities/category.entity';
import { HashedRouteParam } from '../utils/hashids';

@Controller('api/products')
export class ProductsController {
    static entity = Product;

    constructor(private readonly productsService: ProductsService) {}

    @Post()
    create(@Body() createProductBodyDto: CreateProductBodyDto) {
        const categoryId = Category.decodeHashedId(
            createProductBodyDto.categoryId,
        );

        const createProductDto: CreateProductDto = Object.assign(
            new CreateProductDto(),
            {
                ...createProductBodyDto,
                categoryId,
            },
        );

        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(
        @Query('category_slug') category_slug?: string,
        @Query('name') name?: string,
    ) {
        return this.productsService.findAll(category_slug, name);
    }

    @Get(':id')
    findOne(@HashedRouteParam('id') id: number) {

        return this.productsService.findOne({ id });
    }

    @Patch(':id')
    update(
        @HashedRouteParam('id') id: number,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        return this.productsService.update(id , updateProductDto);
    }

    @Delete(':id')
    remove(@HashedRouteParam('id') id: number) {
        return this.productsService.remove(id);
    }
}
