const config = {
    input: ['src/**/*.controller.ts'],
    output: 'src/api',
    swagger: {
        output: 'swagger.json',
    },
    assert: true,
    json: true,
};
export default config;
