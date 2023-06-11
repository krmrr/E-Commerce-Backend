import { Body, Controller, NotFoundException } from '@nestjs/common';
import { Auth, CurrentUser } from 'src/auth/authentication/decorators';
import { UpdateProfileDto, UserDto } from './dto';
import { User } from './entities';
import { UsersService } from './users.service';
import { Paginate, PaginateQuery } from '../utils/paginate';
import { Get, Put } from '../utils/nestia';
import { RouteEntity } from '../utils/route-entity-binding';

@Controller('api/users')
export class UsersController {
    static entity = User;

    constructor(private readonly usersService: UsersService) {}

    //@Roles(Role.Admin)
    @Get()
    findAll(@Paginate() query: PaginateQuery) {
        return this.usersService.findAll(
            //{ relations: ['posts'] },
            { dto: UserDto },
            query,
        );
    }

    //@Permissions(Permission.ShowMe)
    @Auth()
    @Get('me')
    getProfile(@CurrentUser() user: User): UserDto | undefined {
        return !!user ? new UserDto(user) : undefined;
    }

    @Get(':username')
    async findOne(@RouteEntity('username') user: User) {
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user && new UserDto(user);
    }

    @Auth()
    @Put('profile')
    async update(
        @CurrentUser() user: User,
        @Body() updateUserDto: UpdateProfileDto,
    ) {
        const res = await this.usersService.update(user.id, updateUserDto);
        return res && new UserDto(res);
    }
}
