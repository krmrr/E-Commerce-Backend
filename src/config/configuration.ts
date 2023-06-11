import { DriverType } from '@codebrew/nestjs-storage';
import { editFileName } from '../media-library/utils/multerHelpers';
import { getAbsolutePath } from '../helpers/filesystem';
import { env } from './environment';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter.js';
import handleBarsHelpers from '../helpers/handlebars';

export const publicStorageRoot = getAbsolutePath(
    env.LOCAL_STORAGE_DEST ?? './storage/app/public',
);
export const mailTemplatesRoot = getAbsolutePath('/views/mail/templates');

export default () => ({
    auth: {
        atKey: env.JWT_AT_KEY,
        rtKey: env.JWT_RT_KEY,
        atExpiresIn: env.JWT_AT_EXPIRES_IN ?? 900,
        rtExpiresIn: env.JWT_RT_EXPIRES_IN ?? 1209600,
        options: {
            property: 'auth',
        },
    },
    throttler: {
        ttl: env.THROTTLE_TTL ?? 60,
        limit: env.THROTTLE_LIMIT ?? 10,
    },
    storage: {
        default: 'local',
        disks: {
            local: {
                driver: DriverType.LOCAL,
                config: {
                    root: publicStorageRoot,
                },
            },
        },
    },
    multer: {
        storage: {
            destination: env.MULTER_DEST ?? './storage/app/temp',
            filename: editFileName,
        },
    },
    mailer: {
        transport: {
            host: env.MAILER_HOST,
            port: env.MAILER_PORT ?? 587,
            secure: env.MAILER_SECURE ?? false,
            auth: {
                user: env.MAILER_USERNAME,
                pass: env.MAILER_PASSWORD,
            },
        },
        defaults: {
            from: `"${env.MAILER_FROM_NAME}" <${env.MAILER_FROM_ADDRESS}>`,
        },
        preview: env.MAILER_PREVIEW ?? false,
        template: {
            dir: mailTemplatesRoot,
            adapter: new HandlebarsAdapter(handleBarsHelpers, {
                inlineCssEnabled: true,
                /** See https://www.npmjs.com/package/inline-css#api */
                inlineCssOptions: {
                    url: ' ',
                    preserveMediaQueries: true,
                },
            }),
            options: {
                strict: true,
            },
        },
    },
    urlGenerator: {
        secret: env.URL_GENERATOR_SECRET, // optional, required only for signed URL
        appUrl: env.APP_URL,
    },
});
