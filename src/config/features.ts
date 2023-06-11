import compression from 'compression';
import qs from 'qs';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { corsWhitelist } from './security';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { rootDirName } from '../helpers/filesystem';
import { engine as handlebarsEngine } from 'express-handlebars';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { forEach } from 'lodash';
import { env } from './environment';
import { publicStorageRoot } from './configuration';
import fs from 'fs-extra';
import { UnauthorizedException } from '@nestjs/common';
import handleBarsHelpers from '../helpers/handlebars';

type IEnabledFeatures = {
    [x in keyof typeof allFeatures]: boolean;
};

export const enabledFeatures: IEnabledFeatures = {
    compression: env.ENABLE_COMPRESSION ?? true,
    queryParser: true,
    cookieParser: true,
    poweredByHeaders: true,
    xForwardedHeader: env.FORCE_X_FORWARDED_HEADER ?? false,
    helmet: true,
    cors: true,
    staticAssets: true,
    viewEngine: true,
    swagger: env.SWAGGER_ENABLED ?? false,
};

export const allFeatures = {
    compression: useCompression,
    queryParser: configureQueryParser,
    cookieParser: useCookieParser,
    poweredByHeaders: changePoweredByHeaders,
    xForwardedHeader: setXForwardedHeader,
    helmet: useHelmet,
    cors: useCors,
    staticAssets: useStaticAssets,
    viewEngine: useViewEngine,
    swagger: useSwagger,
};

export function configureFeatures(app: NestExpressApplication) {
    forEach(enabledFeatures, function (value, key) {
        if (value) {
            allFeatures[key](app);
        }
    });
}

function useCompression(app: NestExpressApplication) {
    function shouldCompress(req, res) {
        if (req.headers['x-no-compression']) {
            // don't compress responses with this request header
            return false;
        }

        // fallback to standard filter function
        return compression.filter(req, res);
    }

    app.use(compression({ filter: shouldCompress }));
}

function configureQueryParser(app: NestExpressApplication) {
    app.set('query parser', function (rawQs) {
        const parsed = qs.parse(rawQs);
        return parsed;
    });
}

function useCookieParser(app: NestExpressApplication) {
    app.use(cookieParser());
}

function changePoweredByHeaders(app: NestExpressApplication) {
    app.use(function (req, res, next) {
        res.setHeader('X-Powered-By', 'Krmr');
        next();
    });
}

function setXForwardedHeader(app: NestExpressApplication) {
    app.use(function (req, res, next) {
        if (!req.headers['x-forwarded-proto']) {
            req.headers['x-forwarded-proto'] = 'https';
        }
        next();
    });
}

function useHelmet(app: NestExpressApplication) {
    app.use(
        helmet({
            hidePoweredBy: false,
          crossOriginResourcePolicy: false,
        }),
    );
}

function useCors(app: NestExpressApplication) {
    app.enableCors({
        origin: function (origin, callback) {
            if (!origin || corsWhitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new UnauthorizedException('Not allowed by CORS'));
            }
        },
        allowedHeaders:
            'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe,Authorization',
        methods: 'GET,PUT,POST,PATCH,DELETE,UPDATE,OPTIONS',
        credentials: true,
    });
}

function useStaticAssets(app: NestExpressApplication) {
    const staticFilesRoot = join(rootDirName, 'public');

    app.useStaticAssets(staticFilesRoot);
    app.useStaticAssets(publicStorageRoot, { prefix: '/storage/' });
}

function useViewEngine(app: NestExpressApplication) {
    const viewEngineTemplatesRoot = join(rootDirName, 'views');

    app.engine(
        '.hbs',
        handlebarsEngine({
            extname: '.hbs',
            defaultLayout: false,
            helpers: handleBarsHelpers,
        }),
    );
    app.setViewEngine('handlebars');
    app.setBaseViewsDir(viewEngineTemplatesRoot);
}

function useSwagger(app: NestExpressApplication) {
    let document: OpenAPIObject;
    if (env.SWAGGER_USE_NESTIA ?? false) {
        document = JSON.parse(
            fs.readFileSync(join(rootDirName, 'swagger.json')).toString(),
        );
    } else {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('KRMR')
            .setDescription('API for the KRMR.')
            .setVersion('1.0')
            .build();
        document = SwaggerModule.createDocument(app, swaggerConfig);
    }

    SwaggerModule.setup('swagger', app, document);
}
