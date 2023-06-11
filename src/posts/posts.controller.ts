import { Body, Controller, NotFoundException } from '@nestjs/common';
import { Auth, CurrentUser } from '../auth/authentication/decorators';
import { User } from '../users/entities';
import { CreatePostDto, UpdatePostDto } from './dto';
import { PostsService } from './posts.service';
import { HashedRouteParam } from '../utils/hashids';
import { Action } from '../auth/authorization/constants';
import { Permissions } from '../auth/authorization/decorators';
import { Post as PostEntity } from './entities';
import { Paginate, PaginateQuery } from '../utils/paginate';
import { Delete, Get, Post, Put } from '../utils/nestia';
import { ResolveEntities, RouteEntity } from '../utils/route-entity-binding';

@Controller('api/posts')
export class PostsController {
    static entity = PostEntity;

    constructor(private readonly postsService: PostsService) {}

    @Permissions(Action.Create, PostEntity)
    @Auth()
    @Post()
    create(@CurrentUser() user: User, @Body() createPostDto: CreatePostDto) {
        return this.postsService.create(user.id, createPostDto);
    }

    // Method name is findAll so @Permissions decorator will use it as Action.Index action.
    // Also, it will use PostEntity as Subject because PostsController.entity is PostEntity.
    @Permissions('can')
    @Auth()
    @Get()
    findAll(@Paginate() query: PaginateQuery) {
        return this.postsService.findAll({ relations: ['author'] }, query);
    }

    // Method name is findOne so @Permissions decorator will use it as Action.Read action.
    // Also, it will use PostEntity as Subject because PostsController.entity is PostEntity.
    @Permissions()
    @Auth()
    @Get(':id')
    findOne(@RouteEntity('id') post: PostEntity) {
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        params: {
            id: PostEntity,
        },
    })
    @Auth()
    @Put(':id')
    update(
        @CurrentUser() user: User,
        @HashedRouteParam('id') id: number,
        @Body() updatePostDto: UpdatePostDto,
    ) {
        return this.postsService.update(id, updatePostDto);
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        'params.id': PostEntity,
    })
    @Auth()
    @Delete(':id')
    remove(@CurrentUser() user: User, @HashedRouteParam('id') id: number) {
        // The commented code below shows that we aren't forced to use @Permissions and @ResolveEntities decorators
        // while checking user's permission to modify a specific entity.

        /*const post = await this.postsService.findOne({
            id,
            relations: ['author'],
        });

        await user.can(
            PostCaslAbilityFactory,
            post,
            undefined,
            true,
            Action.Delete,
        );*/

        return this.postsService.remove(id);
    }
}
