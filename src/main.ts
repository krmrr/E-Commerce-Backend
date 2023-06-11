import { isVite, port } from './config/environment';
import { NestFactory } from '@nestjs/core';
import {
    ExpressAdapter,
    NestExpressApplication,
} from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
    INestApplication,
    NestApplicationOptions,
    ValidationPipe,
} from '@nestjs/common';
import { configureFeatures } from './config/features';
import { useContainer } from 'class-validator';

const appOptions: Parameters<typeof NestFactory.create>[2] = {};

async function createApp(
    options?: NestApplicationOptions,
): Promise<INestApplication> {
    const app = await NestFactory.create<NestExpressApplication>(
        AppModule,
        new ExpressAdapter(),
        options,
    );
    app.set('trust proxy', true);
    configureFeatures(app);

    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
        }),
    );

    return app;
}

const main = () =>
    createApp(appOptions).then(async (app) => {
        await app.listen(port);

        // @ts-ignore
        if (module.hot) {
            // @ts-ignore
            module.hot.accept();
            // @ts-ignore
            module.hot.dispose(() => app.close());
        }
    });

export let viteNodeApp;

if (!isVite) {
    void main();
} else {
    viteNodeApp = createApp();
}
