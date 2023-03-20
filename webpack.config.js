const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
    mode: "production",
    entry: {
        background: path.resolve(__dirname, "background.ts"),
        popup: path.resolve(__dirname,"src", "popup", "popup.ts"),
        scripts: path.resolve(__dirname,"src", "scripts", "content-script.ts")
    },
    output: {
        clean: true,
        path: path.resolve(__dirname, 'dist'),
        filename: (pathData) => {
            if (pathData.chunk.name === 'background') {
                return '[name].js';
            } else if(pathData.chunk.name.includes('scripts')) {
                return 'scripts/content-script.js'
            }
            return '[name]/[name].js';
        },
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'src',
                    globOptions: {
                        dot: true,
                        ignore: ['**/manifest.json', '**/*.ts'],
                    },
                    to({ context, absoluteFilename }) {
                        const relativePath = path.relative(context, absoluteFilename);
                        return `./${relativePath}`;
                    },
                },
                { from: 'manifest.json', to: '.' },
                { from: 'TedHelper.html', to: '.' },
            ],
        }),
    ],
};