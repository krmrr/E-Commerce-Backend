// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs-extra');

const nativeNodeModulesPlugin = {
    name: 'native-node-modules',
    setup(build) {
        // If a ".node" file is imported within a module in the "file" namespace, resolve
        // it to an absolute path and put it into the "node-file" virtual namespace.
        build.onResolve({ filter: /\.node$/, namespace: 'file' }, (args) => ({
            path: require.resolve(args.path, { paths: [args.resolveDir] }),
            namespace: 'node-file',
        }));

        // Files in the "node-file" virtual namespace call "require()" on the
        // path from esbuild of the ".node" file in the output directory.
        build.onLoad({ filter: /.*/, namespace: 'node-file' }, (args) => ({
            contents: `
        import path from ${JSON.stringify(args.path)}
        try { module.exports = require(path) }
        catch {}
      `,
        }));

        // If a ".node" file is imported within a module in the "node-file" namespace, put
        // it in the "file" namespace where esbuild's default loading behavior will handle
        // it. It is already an absolute path since we resolved it to one above.
        build.onResolve(
            { filter: /\.node$/, namespace: 'node-file' },
            (args) => ({
                path: args.path,
                namespace: 'file',
            }),
        );

        // Tell esbuild's default loading behavior to use the "file" loader for
        // these ".node" files.
        let opts = build.initialOptions;
        opts.loader = opts.loader || {};
        opts.loader['.node'] = 'file';
    },
};

const outDir = './dist2';

(async function () {
    await esbuild
        .build({
            entryPoints: ['./dist/src/main.js'],
            bundle: true,
            minify: true,
            keepNames: true,
            platform: 'node',
            target: 'node10.24',
            outdir: outDir,
            external: [
                // esbuild
                'node-monkey',
                'nanoid',
                'file-type',
                'emitter',
                'degenerator',
                // common with vite.config.ts
                '@node-rs/argon2',
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
            ],
            plugins: [nativeNodeModulesPlugin],
            inject: ['./esbuild-mikroorm-patch.ts'],
        })
        .catch(() => process.exit(1));

    await fs.copy('./public', outDir + '/public', function (err) {
        if (err) {
            console.log('An error occurred while copying the public folder.');
            return console.error(err);
        }
    });

    await fs.copy('./views', outDir + '/views', function (err) {
        if (err) {
            console.log('An error occurred while copying the views folder.');
            return console.error(err);
        }
    });

    await fs.copy('.env.example', outDir + '/.env.example', function (err) {
        if (err) {
            console.log(
                'An error occurred while copying the .env.example file',
            );
            return console.error(err);
        }
    });

    console.log('\x1b[32m', '\x1b[47m', '---- BUILD COMPLETE! ----', '\x1b[0m');
})();
