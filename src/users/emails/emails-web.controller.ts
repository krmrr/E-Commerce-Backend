import {
    Controller,
    forwardRef,
    Get,
    Inject,
    Query,
    UseGuards,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { Email } from './entities';
import { SignedUrlGuard } from 'nestjs-url-generator';

@Controller('emails')
export class EmailsWebController {
    static entity = Email;

    constructor(
        @Inject(forwardRef(() => EmailsService))
        private readonly emailsService: EmailsService,
    ) {}

    @Get('confirm')
    @UseGuards(SignedUrlGuard)
    async confirm(
        @Query('email') emailAddress: string,
        @Query('code') code: string,
    ) {
        return this.emailsService.confirm(emailAddress, code);
    }
}
