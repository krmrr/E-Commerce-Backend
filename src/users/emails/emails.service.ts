import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, expr, FilterQuery, Loaded } from '@mikro-orm/core';
import { Email } from './entities';
import { FindOptions } from '@mikro-orm/core/drivers/IDatabaseDriver';
import { RelationColumn } from '../../utils/paginate';
import { User } from '../entities';
import { isNil, omitBy } from 'lodash';
import { CountryCode } from '../phone-numbers/constants';
import { CreateEmailDto, UpdateEmailDto } from './dto';
import { SOFT_DELETABLE_FILTER } from 'mikro-orm-soft-delete';
import { MailerService } from '@nestjs-modules/mailer';
import { createSendMailOptions } from '../../helpers/mailer';
import { VerificationCode } from '../../verification-codes/entities';
import { ChannelType, Event } from '../../verification-codes/constants';
import { EmailsWebController } from './emails-web.controller';
import { UrlGeneratorService } from 'nestjs-url-generator';

interface ResolveRelationsInput {
    userId: string;
    countryCode?: CountryCode;
}

interface FindAllArgs {
    relations?: RelationColumn<Email>[];
    userId?: number;
}

interface FindOneArgs extends FindAllArgs {
    id?: number;
    address?: string;
    showSoftDeleted?: boolean;
}

type FindOneArgsWithEntity = Email | FindOneArgs;

@Injectable()
export class EmailsService {
    constructor(
        @InjectRepository(Email)
        private emailsRepository: EntityRepository<Email>,
        private mailerService: MailerService,
        private readonly urlGeneratorService: UrlGeneratorService,
    ) {}

    static async resolveRelations(input: ResolveRelationsInput) {
        const user = await User.repository().findOneByHashid(input.userId);

        const relations = omitBy(
            {
                user,
            },
            isNil,
        );

        return relations;
    }

    static async prepareEmailPayload(
        input: CreateEmailDto | UpdateEmailDto,
    ): Promise<Partial<Email>> {
        const relations = await EmailsService.resolveRelations(input);

        const payload = {
            ...input,
            ...relations,
        };

        return payload;
    }

    sendConfirmationEmail(email: Email, url: string) {
        return this.mailerService.sendMail(
            createSendMailOptions({
                to: email.address,
                subject: '👋 Confirm your email address',
                template: './confirm-email',
                context: {
                    link: url,
                    name: email.user.firstName,
                },
            }),
        );
    }

    async checkDuplicates(address: string) {
        if (!address) return;
        const isExist = (await this.emailsRepository.count({ address })) > 0;

        if (isExist) {
            throw new ConflictException(
                'This email address already exists on our database',
            );
        }
    }

    async create(createEmailDto: Partial<Email>, sendConfirmation = false) {
        const { address } = createEmailDto;
        await this.checkDuplicates(address);
        const email = this.emailsRepository.create(createEmailDto);
        await this.emailsRepository.persistAndFlush(email);

        if (sendConfirmation) {
            await this.sendConfirmation(email);
        }

        return email;
    }

    findAll(args?: FindAllArgs) {
        const { relations, userId } = args || {};

        const filter: FilterQuery<Email> = {};
        const options: FindOptions<Email, any> = {};

        if (userId) {
            filter.user = { id: userId };
        }
        if (relations) {
            options.populate = relations;
        }

        return this.emailsRepository.find(filter, options);
    }

    async findOne(
        { id, address, relations, showSoftDeleted }: FindOneArgs,
        throwNotFoundException: boolean = false,
    ) {
        let where: FilterQuery<Email> = {};
        const options: FindOptions<Email, any> = {};

        if (id) {
            where = id;
        } else if (address) {
            where = { [expr('lower(address)')]: address.toLowerCase() };
        } else {
            throw new BadRequestException(
                'One of id or address must be provided',
            );
        }
        if (relations) {
            options.populate = relations;
        }
        if (showSoftDeleted) {
            options.filters = { [SOFT_DELETABLE_FILTER]: false };
        }

        const email = await this.emailsRepository.findOne(where, options);
        if (!email && throwNotFoundException) {
            throw new NotFoundException('Email not found');
        }

        return email;
    }

    async confirm(emailAddress: string, code: string): Promise<string> {
        const email = await this.findOne({
            address: emailAddress,
        });
        if (email.confirmedAt) {
            return 'This email address is already confirmed';
        }
        const user = email.user;

        await VerificationCode.verify(
            user,
            email,
            Event.AddEmail,
            ChannelType.Email,
            undefined,
            code,
        );
        await this.update(email, { confirmedAt: new Date() });

        return 'Email confirmed successfully';
    }

    async update(
        where: FindOneArgsWithEntity,
        updateEmailDto: Partial<Email>,
        sendConfirmation: boolean = false,
    ): Promise<Loaded<Email>> {
        const whereInputIsEntity = where instanceof Email;
        const email: Email = whereInputIsEntity
            ? where
            : await this.findOne(where);

        if (whereInputIsEntity && updateEmailDto.address) {
            await this.checkDuplicates(updateEmailDto.address);
        }
        email.assign(updateEmailDto);
        await this.emailsRepository.persistAndFlush(email);

        if (sendConfirmation) {
            await this.sendConfirmation(email);
        }

        return email;
    }

    async remove(where: FindOneArgsWithEntity) {
        const whereInputIsEntity = where instanceof Email;
        const email: Email = whereInputIsEntity
            ? where
            : await this.findOne(where);

        if (!whereInputIsEntity && where.showSoftDeleted) {
            await email.hardDelete();
        } else {
            await this.emailsRepository.removeAndFlush(email);
        }
        return true;
    }

    async sendConfirmation(email: Email) {
        const url = await this.createConfirmationUrl(email);
        await this.sendConfirmationEmail(email, url);

        return url;
    }

    async createConfirmationUrl(email: Email) {
        const { user, address } = email;
        // 1 day in seconds
        const ttl = 60 * 60 * 24;

        const verificationCode = await VerificationCode.generate(
            user,
            email,
            Event.AddEmail,
            ChannelType.Email,
            ttl,
        );
        const query = {
            email: address,
            code: verificationCode.code,
        };
        const url = this.urlGeneratorService.signControllerUrl({
            controller: EmailsWebController,
            controllerMethod: EmailsWebController.prototype.confirm,
            query,
        });

        return url;
    }
}
