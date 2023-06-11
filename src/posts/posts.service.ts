import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from './dto';
import { Post } from './entities';
import {
    FilterOperator,
    paginate,
    Paginated,
    PaginateQuery,
    RelationColumn,
} from '../utils/paginate';

interface FindAllArgs {
    relations?: RelationColumn<Post>[];
    authorId?: number;
}

interface FindOneArgs extends FindAllArgs {
    id: number;
}

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private postsRepository: EntityRepository<Post>,
    ) {}

    async create(authorId: number, createPostDto: CreatePostDto) {
        const post = this.postsRepository.create({
            author: {
                id: authorId,
            },
            ...createPostDto,
        });
        await this.postsRepository.persistAndFlush(post);
        return post;
    }

    findAll(
        args?: FindAllArgs,
        query?: PaginateQuery,
    ): Promise<Paginated<Post>> {
        const { relations, authorId } = args || {};
        let where: FilterQuery<Post> = {};
        if (authorId) {
            where = { ...where, author: { id: authorId } };
        }
        return paginate(query, this.postsRepository, {
            sortableColumns: ['id', 'title', 'body'],
            searchableColumns: ['title', 'body'],
            defaultSortBy: [['id', 'desc']],
            filterableColumns: {
                title: [FilterOperator.LIKE, FilterOperator.EQ],
                body: [
                    FilterOperator.NULL,
                    FilterOperator.NNULL,
                    FilterOperator.LIKE,
                ],
            },
            where,
            relations,
        });
    }

    async findOne(
        { id, relations }: FindOneArgs,
        throwNotFoundException: boolean = false,
    ) {
        const post = await this.postsRepository.findOne(
            { id },
            {
                populate: relations,
            },
        );

        if (!post && throwNotFoundException) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }

    async update(id: number, updatePostDto: UpdatePostDto) {
        const post = await this.findOne({ id }, true);
        this.postsRepository.assign(post, updatePostDto);
        await this.postsRepository.flush();
        return post;
    }

    async remove(id: number) {
        const post = await this.findOne({ id }, true);
        await this.postsRepository.removeAndFlush(post);
        return true;
    }
}
