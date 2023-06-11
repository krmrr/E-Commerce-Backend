import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Product } from "./entities/product.entity";
import { CategoriesService } from "../categories/categories.service";
import { EntityRepository, FilterQuery } from "@mikro-orm/core";
import { RelationColumn } from "../utils/paginate";
import { FindOptions } from "@mikro-orm/core/drivers/IDatabaseDriver";
import { isUndefined, omitBy } from "lodash";

interface FindAllArgs {
  relations?: RelationColumn<Product>[];
  categoryId?: number;
}

interface FindOneArgs extends FindAllArgs {
  id?: number;
  slug?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: EntityRepository<Product>,
    private categoriesService: CategoriesService
  ) {
  }

  async create(createProductDto: CreateProductDto) {
    const category = await this.categoriesService.findOne({
      id: createProductDto.categoryId
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    const slugify = (str) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const titleConvertSlug1 =
      slugify(createProductDto.name) +
      "-" +
      Math.floor(Math.random() * 10000).toString();

    // @ts-ignore
    const product = this.productRepository.create({
      ...createProductDto,
      slug: titleConvertSlug1,
      category: { id: createProductDto.categoryId }
    });

    await this.productRepository.persistAndFlush(product);
    return product;
  }

  async findAll(category_slug: string, name: string) {
    let where: FilterQuery<Product> = {};

    const options: FindOptions<Product, any> = {
      populate: ["category"]
    };

    if (category_slug) {
      where.category = { slug: category_slug };
    }

    if(name) {
      where = {
        name: {
          $like: "%" + name + "%"
        }
      };
    }

    return this.productRepository.find(where, options);
  }

  async findOne(
    { id, slug, relations }: FindOneArgs,
    throwNotFoundException: boolean = false
  ) {
    let where: FilterQuery<Product> = {};

    const options: FindOptions<Product, any> = {
      populate: ["category"]
    };

    if (id) {
      where.id = id;
    }

    if (slug) {
      where.slug = slug;
    }

    console.log(where);

    const product = await this.productRepository.findOne(where, options);

    if (!product && throwNotFoundException) {
      throw new NotFoundException("Category not found");
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne({ id });
    console.log(updateProductDto, " deneme");
    this.productRepository.assign(
      product,
      omitBy(
        updateProductDto,
        isUndefined
      )
    );

    await this.productRepository.flush();
    return product;
  }

  async remove(id: number) {
    const product = await this.findOne({ id }, true);
    await this.productRepository.removeAndFlush(product);
    return true;
  }
}
