import { join } from 'path';
import { mailTemplatesRoot } from '../config/configuration';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import merge from 'ts-deepmerge';
import { env } from '../config/environment';

export const initialSendMailOptions: ISendMailOptions = {
    context: {
        company: {
            name: env.APP_NAME,
            url: 'https://company.com',
            logoUrl: 'cid:company-logo',
        },
        footer: {
            poweredByText: 'Powered by ' + env.APP_NAME,
            slogan: '«Your company slogan»',
            links: [
                {
                    text: 'Website',
                    url: 'https://company.com',
                },
                {
                    text: 'GitHub',
                    url: 'https://github.com/Company',
                },
                {
                    text: 'Twitter',
                    url: 'https://twitter.com/company',
                },
            ],
        },
    },
    attachments: [
        {
            filename: 'logo.png',
            path: getImageAttachmentPath('logo.png'),
            cid: 'company-logo',
        },
    ],
};

export function createSendMailOptions(sendMailOptions: ISendMailOptions) {
    return merge({}, initialSendMailOptions, sendMailOptions);
}

export function getAttachmentPath(path: string) {
    return join(mailTemplatesRoot, path);
}

export function getImageAttachmentPath(path: string) {
    return join(getAttachmentPath('images'), path);
}
