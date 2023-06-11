import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreatePhoneNumberDto, UpdatePhoneNumberDto } from './dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { PhoneNumber } from './entities';
import { CountryCode } from './constants';
import {
    parsePhoneNumberFromString,
    PhoneNumber as ParsedPhoneNumber,
} from 'libphonenumber-js';
import { Country } from '../../world/countries/entities';
import { User } from '../entities';
import { isNil, omitBy } from 'lodash';
import { RelationColumn } from '../../utils/paginate';
import { FindOptions } from '@mikro-orm/core/drivers/IDatabaseDriver';
import { SOFT_DELETABLE_FILTER } from 'mikro-orm-soft-delete';

interface ResolveRelationsInput {
    userId: string;
    countryCode?: CountryCode;
}

interface FindAllArgs {
    relations?: RelationColumn<PhoneNumber>[];
    userId?: number;
}

interface FindOneArgs extends FindAllArgs {
    id?: number;
    e164Format?: string;
    showSoftDeleted?: boolean;
}

interface PhoneNumberFormats {
    e164Format: string;
    nationalFormat: string;
    internationalFormat: string;
}

@Injectable()
export class PhoneNumbersService {
    constructor(
        @InjectRepository(PhoneNumber)
        private phoneNumbersRepository: EntityRepository<PhoneNumber>,
    ) {}

    static async resolveRelations(input: ResolveRelationsInput) {
        const countryPromise = Country.repository().findOne({
            iso2: input.countryCode,
        });

        const userPromise = User.repository().findOneByHashid(input.userId);

        const [country, user] = await Promise.all([
            countryPromise,
            userPromise,
        ]);

        const relations = omitBy(
            {
                country,
                user,
            },
            isNil,
        );

        return relations;
    }

    static validatePhoneNumberWithCountryCode(
        phoneNumber: string | ParsedPhoneNumber,
        countryCode: CountryCode,
        throwException: boolean = false,
    ) {
        const parsedPhoneNumberObject =
            typeof phoneNumber !== 'string'
                ? phoneNumber
                : parsePhoneNumberFromString(phoneNumber, countryCode);
        const parsedCountryCode = parsedPhoneNumberObject?.country;
        const pass = parsedCountryCode === countryCode;

        if (throwException && !pass) {
            throw new BadRequestException(
                'Phone number does not match with country code',
            );
        }

        return pass;
    }

    static generateFormats(phoneNumber: ParsedPhoneNumber) {
        const e164Format = phoneNumber.format('E.164');
        const nationalFormat = phoneNumber.format('NATIONAL');
        const internationalFormat = phoneNumber.format('INTERNATIONAL');

        return {
            e164Format,
            nationalFormat,
            internationalFormat,
        };
    }

    static async preparePhoneNumberPayload(
        input: CreatePhoneNumberDto | UpdatePhoneNumberDto,
    ): Promise<Partial<PhoneNumber>> {
        let formats: PhoneNumberFormats;

        if (input.phoneNumber) {
            const parsedPhoneNumberObject = parsePhoneNumberFromString(
                input.phoneNumber,
                input.countryCode,
            );

            PhoneNumbersService.validatePhoneNumberWithCountryCode(
                parsedPhoneNumberObject,
                input.countryCode,
                true,
            );

            formats = PhoneNumbersService.generateFormats(
                parsedPhoneNumberObject,
            );
        }

        const relations = await PhoneNumbersService.resolveRelations(input);

        const payload = {
            ...input,
            ...relations,
            ...(formats ?? {}),
        };

        delete payload.phoneNumber;
        delete payload.countryCode;
        delete payload.userId;

        return payload;
    }

    async checkDuplicates(e164Format: string) {
        if (!e164Format) return;
        const isExist =
            (await this.phoneNumbersRepository.count({ e164Format })) > 0;

        if (isExist) {
            throw new ConflictException(
                'This phone number already exists on our database',
            );
        }
    }

    async create(payload: Partial<PhoneNumber>) {
        const { e164Format } = payload;
        await this.checkDuplicates(e164Format);
        const phoneNumber = this.phoneNumbersRepository.create(payload);
        await this.phoneNumbersRepository.persistAndFlush(phoneNumber);

        return phoneNumber;
    }

    async findAll(args?: FindAllArgs) {
        const { relations, userId } = args || {};

        const filter: FilterQuery<PhoneNumber> = {};
        const options: FindOptions<PhoneNumber, any> = {};

        if (userId) {
            filter.user = { id: userId };
        }
        if (relations) {
            options.populate = relations;
        }

        return this.phoneNumbersRepository.find(filter, options);
    }

    async findOne(
        { id, e164Format, relations, showSoftDeleted }: FindOneArgs,
        throwNotFoundException: boolean = false,
    ) {
        let where: FilterQuery<PhoneNumber> = {};
        const options: FindOptions<PhoneNumber, any> = {};

        if (id) {
            where = id;
        } else if (e164Format) {
            where = { e164Format };
        } else {
            throw new BadRequestException(
                'One of id or e164Format must be provided',
            );
        }
        if (relations) {
            options.populate = relations;
        }
        if (showSoftDeleted) {
            options.filters = { [SOFT_DELETABLE_FILTER]: false };
        }
        const phoneNumber = await this.phoneNumbersRepository.findOne(
            where,
            options,
        );

        if (!phoneNumber && throwNotFoundException) {
            throw new NotFoundException('Phone number not found');
        }

        return phoneNumber;
    }

    async update(where: FindOneArgs, payload: Partial<PhoneNumber>) {
        const { e164Format } = payload;
        const phoneNumber = await this.findOne(where, true);

        if (phoneNumber.e164Format === e164Format) {
            delete payload.e164Format;
        } else {
            await this.checkDuplicates(e164Format);
        }

        phoneNumber.assign(payload);
        await this.phoneNumbersRepository.persistAndFlush(phoneNumber);

        return phoneNumber;
    }

    async remove(where: FindOneArgs) {
        const phoneNumber = await this.findOne(where, true);

        if (where.showSoftDeleted) {
            await phoneNumber.hardDelete();
        } else {
            await this.phoneNumbersRepository.removeAndFlush(phoneNumber);
        }

        return true;
    }
}
