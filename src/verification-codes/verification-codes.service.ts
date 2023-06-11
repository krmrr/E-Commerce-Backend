import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VerificationCode } from './entities';

@Injectable()
export class VerificationCodesService {
    constructor(private readonly orm: MikroORM) {}

    @Cron(CronExpression.EVERY_4_HOURS)
    @UseRequestContext()
    async clearOldCodes() {
        await VerificationCode.clearOldCodes();
    }
}
