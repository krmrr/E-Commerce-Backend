import { Body, Controller, Delete } from '@nestjs/common';
import { PhoneNumbersService } from './phone-numbers.service';
import { CreatePhoneNumberDto, UpdatePhoneNumberDto } from './dto';
import { Auth, CurrentUser } from '../../auth/authentication/decorators';
import { User } from '../entities';
import { Get, Post, Put } from '../../utils/nestia';
import { HashedQueryParam, HashedRouteParam } from '../../utils/hashids';
import { PhoneNumber } from './entities';
import { Permissions } from '../../auth/authorization/decorators';
import { ResolveEntities } from '../../utils/route-entity-binding';

@Controller('api/phone-numbers')
export class PhoneNumbersController {
    static entity = PhoneNumber;

    constructor(private readonly phoneNumbersService: PhoneNumbersService) {}

    @Permissions()
    @Auth()
    @Post()
    async create(
        @CurrentUser() user: User,
        @Body() createPhoneNumberDto: CreatePhoneNumberDto,
    ) {
        const hashedUserId = user.hashid();
        createPhoneNumberDto.userId = hashedUserId;
        if (!createPhoneNumberDto.contactName) {
            createPhoneNumberDto.contactName = user.fullName;
        }
        const payload = await PhoneNumbersService.preparePhoneNumberPayload(
            createPhoneNumberDto,
        );
        return this.phoneNumbersService.create(payload);
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
        return this.phoneNumbersService.findAll({ userId: user.id });
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        params: {
            id: PhoneNumber,
        },
    })
    @Auth()
    @Get(':id')
    async findOne(@HashedRouteParam('id') id: number) {
        const phoneNumber = await this.phoneNumbersService.findOne(
            { id },
            true,
        );
        return phoneNumber;
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        params: {
            id: PhoneNumber,
        },
    })
    @Auth()
    @Put(':id')
    async update(
        @HashedRouteParam('id') id: number,
        @Body() updatePhoneNumberDto: UpdatePhoneNumberDto,
    ) {
        const payload = await PhoneNumbersService.preparePhoneNumberPayload(
            updatePhoneNumberDto,
        );
        return this.phoneNumbersService.update({ id }, payload);
    }

    @Permissions('entity:params.id')
    @ResolveEntities({
        params: {
            id: PhoneNumber,
        },
    })
    @Auth()
    @Delete(':id')
    remove(@HashedRouteParam('id') id: number) {
        return this.phoneNumbersService.remove({ id });
    }
}
