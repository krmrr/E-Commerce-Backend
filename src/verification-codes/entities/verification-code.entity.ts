import {
    Entity,
    EntityRepository,
    Enum,
    ManyToOne,
    Property,
} from '@mikro-orm/core';
import { BaseEntity } from '../../database/entities';
import { HashedId, hashidsSerializer } from '../../utils/hashids';
import { ChannelType } from '../constants';
import { User } from '../../users/entities';
import {
    Entity as EntityType,
    getEntityName,
} from '../../config/mikro-orm.config';
import { BaseRepository } from '../../database/repositories';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Entity({ tableName: 'verification_codes' })
export class VerificationCode extends BaseEntity<VerificationCode, 'id'> {
    protected static numericDigits = 5;

    @HashedId()
    id: number;

    @ManyToOne('User', {
        joinColumn: 'user_id',
        onDelete: 'CASCADE',
        serializer: hashidsSerializer,
        columnType: 'int',
    })
    user: User;

    @Property({ length: 64 })
    targetEntityType: string;

    @Property()
    targetEntityId: number;

    @Property({ length: 128 })
    event: string;

    @Enum({ items: () => ChannelType, type: () => ChannelType, nullable: true })
    channelType: ChannelType;

    @Property({ length: 1024, nullable: true })
    payload?: string;

    @Property({ length: 12 })
    code: string;

    @Property({ default: false })
    isInvalidated: boolean;

    @Property({ nullable: true })
    usedAt: Date;

    @Property()
    expiresAt: Date;

    @Property()
    createdAt: Date = new Date();

    @Property({ nullable: true, onUpdate: () => new Date() })
    updatedAt?: Date;

    public static async verify(
        user: User,
        target: InstanceType<EntityType>,
        event: string,
        channelType: ChannelType,
        payload: string,
        code: string,
    ) {
        const targetProperties = VerificationCode.getEntityProperties(target);

        const verificationCode = await (
            VerificationCode.repository() as BaseRepository<VerificationCode>
        ).findOne({
            user,
            targetEntityType: targetProperties.type,
            targetEntityId: targetProperties.id,
            event,
            channelType,
            code,
            payload,
        });

        if (verificationCode) {
            if (verificationCode.usedAt) {
                throw new BadRequestException(
                    'This verification code has already been used',
                );
            }
            if (verificationCode.isInvalidated) {
                throw new BadRequestException(
                    'This verification code is no longer valid',
                );
            }
            if (verificationCode.expiresAt < new Date()) {
                throw new BadRequestException('Verification code expired');
            }

            verificationCode.usedAt = new Date();
            await VerificationCode.repository().persistAndFlush(
                verificationCode,
            );
            return;
        }

        throw new NotFoundException('Verification code not found');
    }

    static generateNumericCode(length = VerificationCode.numericDigits) {
        const code = Math.floor(Math.random() * Math.pow(10, length))
            .toString()
            .padStart(length, '0');
        return code;
    }

    static async generate(
        user: User,
        target: InstanceType<EntityType>,
        event: string,
        channelType: ChannelType,
        expireTime: number | Date = 120,
        payload?: string | null,
        length = VerificationCode.numericDigits,
    ) {
        const expiresAt =
            typeof expireTime === 'number'
                ? new Date(Date.now() + expireTime * 1000)
                : expireTime;

        const targetProperties = VerificationCode.getEntityProperties(target);

        await VerificationCode.repository().nativeUpdate(
            {
                user,
                targetEntityType: targetProperties.type,
                targetEntityId: targetProperties.id,
                event,
                channelType,
                payload,
                expiresAt: {
                    $gte: new Date(),
                },
                usedAt: null,
            },
            {
                isInvalidated: true,
            },
        );

        const verificationCode = new VerificationCode();
        verificationCode.user = user;
        verificationCode.targetEntityType = targetProperties.type;
        verificationCode.targetEntityId = targetProperties.id;
        verificationCode.event = event;
        verificationCode.channelType = channelType;
        verificationCode.payload = payload;
        verificationCode.code = VerificationCode.generateNumericCode(length);
        verificationCode.expiresAt = expiresAt;
        await VerificationCode.repository().persistAndFlush(verificationCode);

        return verificationCode;
    }

    static clearOldCodes(
        repository: EntityRepository<VerificationCode> = VerificationCode.repository() as EntityRepository<VerificationCode>,
    ) {
        return repository.nativeDelete({
            expiresAt: {
                $lt: new Date(),
            },
            // created before more than 6 hours
            createdAt: {
                $lt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            },
        });
    }

    private static getEntityProperties(entity: InstanceType<EntityType>) {
        const entityType = getEntityName(entity);
        const primaryKey = entity.getPrimaryKey();

        return {
            type: entityType,
            id: primaryKey,
        };
    }
}
