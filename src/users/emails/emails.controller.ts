import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Post,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { CreateEmailDto, UpdateEmailDto } from './dto';
import { Email } from './entities';
import { Permissions } from '../../auth/authorization/decorators';
import { Auth, CurrentUser } from '../../auth/authentication/decorators';
import { User } from '../entities';
import { HashedQueryParam } from '../../utils/hashids';
import { ResolveEntities, RouteEntity } from '../../utils/route-entity-binding';
import { Put } from '../../utils/nestia';

@Controller('api/emails')
export class EmailsController {
    static entity = Email;

    constructor(private readonly emailsService: EmailsService) {}

    @Permissions()
    @Auth()
    @Post()
    async create(
        @CurrentUser() user: User,
        @Body() createEmailDto: CreateEmailDto,
    ) {
        const hashedUserId = user.hashid();
        createEmailDto.userId = hashedUserId;
        const payload = await EmailsService.prepareEmailPayload(createEmailDto);
        const email = await this.emailsService.create(payload, true);

        return email;
    }

    @Permissions()
    @Auth()
    @Get()
    async findAll(
        @CurrentUser() currentUser: User,
        @HashedQueryParam('userId') user?: User,
    ) {
        if (!user) {
            user = currentUser;
        }
        return this.emailsService.findAll({ userId: user.id });
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        params: {
            id: Email,
        },
    })
    @Auth()
    @Get(':id')
    async findOne(@RouteEntity('id') email: Email) {
        if (!email) {
            throw new NotFoundException('Email not found');
        }
        return email;
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        params: {
            id: Email,
        },
    })
    @Auth()
    @Put(':id')
    async update(
        @RouteEntity('id') email: Email,
        @Body() updateEmailDto: UpdateEmailDto,
    ) {
        const payload = await EmailsService.prepareEmailPayload(updateEmailDto);
        const mustReconfirmEmailAddress =
            !!payload.address && payload.address !== email.address;

        const finalPayload = mustReconfirmEmailAddress
            ? {
                  ...payload,
                  confirmedAt: null,
              }
            : payload;
        const updatedEmail = await this.emailsService.update(
            email,
            finalPayload,
            mustReconfirmEmailAddress,
        );

        return updatedEmail;
    }

    @Permissions('entity:params.id')
    @ResolveEntities(
        {
            params: {
                id: Email,
            },
        },
        {
            showSoftDeleted: true,
        },
    )
    @Auth()
    @Delete(':id')
    remove(@RouteEntity('id') email: Email) {
        return this.emailsService.remove(email);
    }
}
