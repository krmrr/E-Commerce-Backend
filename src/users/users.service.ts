import { EntityRepository, expr, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto, UserDto } from './dto';
import { User } from './entities';
import {
    FilterOperator,
    paginate,
    PaginateQuery,
    RelationColumn,
} from '../utils/paginate';

interface FindAllArgs {
    relations?: RelationColumn<User>[];
    dto?: typeof UserDto;
}

interface FindOneArgs extends FindAllArgs {
    id?: number;
    username?: string;
    postId?: number;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: EntityRepository<User>,
    ) {}

    async checkDuplicates(username: string) {
        if (!username) return;
        const isExist = (await this.usersRepository.count({ username })) > 0;

        if (isExist) {
            throw new ConflictException(
                'This username already exists on our database',
            );
        }
    }

    async create(createUserDto: Partial<User>) {
        await this.checkDuplicates(createUserDto.username);
        const user = this.usersRepository.create(createUserDto);
        await this.usersRepository.persistAndFlush(user);
        return user;
    }

    async findAll(args?: FindAllArgs, query?: PaginateQuery) {
        const { relations, dto } = args || {};

        const rawResult = await paginate(query, this.usersRepository, {
            sortableColumns: ['createdAt'],
            searchableColumns: ['firstName', 'lastName'],
            defaultSortBy: [['createdAt', 'desc']],
            filterableColumns: {
                firstName: [FilterOperator.LIKE, FilterOperator.EQ],
                lastName: [FilterOperator.LIKE, FilterOperator.EQ],
            },
            relations,
        });

        if (dto) {
            const result = {
                ...rawResult,
                data: rawResult.data.map((user) => new dto(user)),
            };

            return result;
        }

        return rawResult;
    }

    findOne(
        { id, username, postId, relations }: FindOneArgs,
        throwNotFoundException: boolean = false,
    ) {
        let where: FilterQuery<User> = {};
        if (id) {
            where = id;
        } else if (username) {
            where = { [expr('lower(username)')]: username.toLowerCase() };
        } else if (postId) {
            where = { posts: { id: postId } };
        } else {
            throw new BadRequestException(
                'One of ID, username or post ID must be provided',
            );
        }

        const user = this.usersRepository.findOne(where, {
            populate: relations,
        });
        if (!user && throwNotFoundException) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async update(id: number, updateUserDto: UpdateProfileDto) {
        const user = await this.findOne({ id }, true);
        if (updateUserDto.username) {
            await this.checkDuplicates(updateUserDto.username);
        }
        this.usersRepository.assign(user, updateUserDto);
        await this.usersRepository.flush();
        return user;
    }

    async remove(id: number) {
        const user = await this.findOne({ id }, true);
        await this.usersRepository.removeAndFlush(user);
        return true;
    }
}
