import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import tsconfigPaths from 'vite-tsconfig-paths';
import { env } from './src/config/environment';
import nodeMonkey from 'node-monkey';

export default defineConfig(({ mode }) => {
    const port = (env as any).PORT;

    const devVariables = {
        // @ts-ignore
        rootMetaUrl: import.meta.url,
    };

    const envWithDevelepmentVariables = {
        ...env,
        ...devVariables,
    };

    const define = {
        'process.env': envWithDevelepmentVariables,
    };

    const nodeMonkeyEnabled =
        env.NODE_ENV === 'development' && env.NODE_MONKEY_ENABLED;

    if (nodeMonkeyEnabled) {
        nodeMonkey({
            server: {
                host: env.HOST || 'localhost',
            },
        });
    }

    return {
        build: {
            target: 'es2020',
        },
        define,
        optimizeDeps: {
            // Vite does not work well with optionnal dependencies, mark them as ignored for now
            exclude: [
                // vite
                '@node-rs/argon2-darwin-x64',
                '@node-rs/argon2-win32-x64-msvc',
                'file-type',
                // common with esbuild.js
                './processChild',
                'esbuild',
                'class-transformer/storage',
                'cache-manager',
                '@nestjs/websockets',
                '@nestjs/microservices',
                '@grpc/grpc-js',
                '@grpc/proto-loader',
                'mqtt',
                'nats',
                'redis',
                'kafkajs',
                'amqplib',
                'amqp-connection-manager',
                '@nestjs/platform-socket.io',
                '@mikro-orm/mongodb',
                '@mikro-orm/seeder',
                '@mikro-orm/entity-generator',
                '@mikro-orm/migrations',
                '@mikro-orm/mongodb',
                '@mikro-orm/mariadb',
                '@mikro-orm/postgresql',
                '@mikro-orm/sqlite',
                'sqlite3',
                '@mikro-orm/better-sqlite',
                'fastify-swagger',
                '@apollo/subgraph',
                'mock-aws-s3',
                'aws-sdk',
                'apollo-server-fastify',
                'nock',
                'fsevents',
                'better-sqlite3',
                'pg',
                'oracledb',
                'tedious',
                'pg-query-stream',
                'node-monkey',
            ],
        },
        plugins: [
            tsconfigPaths(),
            ...VitePluginNode({
                adapter: 'nest',
                appPath: './src/main.ts',
                tsCompiler: 'swc',
            }),
        ],
        server: {
            port,
        },
    };
});
