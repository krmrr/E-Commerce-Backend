import { Module } from '@nestjs/common';
import { VerificationCodesService } from './verification-codes.service';

@Module({
    providers: [VerificationCodesService],
})
export class VerificationCodesModule {}
