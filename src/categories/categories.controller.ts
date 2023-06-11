import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import {HashedRouteParam} from "../utils/hashids";

@Controller('api/categories')
export class CategoriesController {

    static entity = Category;
    constructor(private readonly categoriesService: CategoriesService) {}

    @Post()
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    findOne(@HashedRouteParam("id") id: number) {
        return this.categoriesService.findOne({ id });
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {

        return this.categoriesService.update(+id, updateCategoryDto);
    }

    @Delete(':id')
    remove(@HashedRouteParam("id") id: number) {
        return this.categoriesService.remove(id);
    }
}
