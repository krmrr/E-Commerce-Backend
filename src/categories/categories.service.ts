import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { Category } from './entities/category.entity';
import { RelationColumn } from '../utils/paginate';
import { FindOptions } from '@mikro-orm/core/drivers/IDatabaseDriver';

interface FindAllArgs {
    relations?: RelationColumn<Category>[];
}

interface FindOneArgs extends FindAllArgs {
    id?: number;
    slug?: string;
}

@Injectable()
export class CategoriesService {

    constructor(
        @InjectRepository(Category)
        private categoriesRepository: EntityRepository<Category>,
    ) {}

    async create(createCategoryDto: CreateCategoryDto) {

        const slugify = (str) =>
            str
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');

        let endSlug;

        const titleConvertSlug1 = slugify(createCategoryDto.title);

        const isFindEqualSlug = await this.findOne({
            slug: titleConvertSlug1,
        });

        if (!isFindEqualSlug) {
            endSlug = titleConvertSlug1;
        } else {
            endSlug =
                titleConvertSlug1 +
                '-' +
                Math.floor(Math.random() * 100).toString();
        }

        const category = this.categoriesRepository.create({
            slug: endSlug,
            ...createCategoryDto,
        });

        await this.categoriesRepository.persistAndFlush(category);

        return category;
    }

    findAll() {
        let where: FilterQuery<Category> = {};
        const options: FindOptions<Category, any> = {};
        return this.categoriesRepository.find(where, options);
    }

    async findOne(
        { id, slug, relations }: FindOneArgs,
        throwNotFoundException: boolean = false,
    ) {
        let where: FilterQuery<Category> = {};
        const options: FindOptions<Category, any> = {};

        if (id) {
            where = { id: id };
        } else if (slug) {
            where = { slug: slug };
        } else {
            throw new BadRequestException('One of id or slug must be provided');
        }

        const category = await this.categoriesRepository.findOne(
            where,
            options,
        );

        if (!category && throwNotFoundException) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    update(id: number, updateCategoryDto: UpdateCategoryDto) {
        return;
        // return "This action updates a #${id} category";
    }

    async remove(id: number) {
        const category = await this.findOne({ id }, true);
        await this.categoriesRepository.nativeDelete(category);
        return true;
    }
}
