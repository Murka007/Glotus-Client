const path = require("path");
const { readFileSync } = require("fs");
const Terser = require("terser-webpack-plugin");
const { version } = require("./package.json");

const mode = process.env.MODE || "development";
const isProd = mode === "production";
const isDev = mode === "development";

class BannerPlugin {
    constructor(banner) {
        this.banner = banner;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync("FileListPlugin", (compilation, callback) => {
            for (const chunk of compilation.chunks) {
                for (const filename of chunk.files) {
                    const asset = compilation.assets[filename];
                    const code = asset._value;
                    asset._value = this.banner.replace(/SCRIPT_VERSION/, version) + code;
                }
            }
            callback();
        })
    }
}

const plugins = [];

if (isProd) plugins.push(
    new BannerPlugin(readFileSync("userscript.header.txt", "utf8"))
)

module.exports = {
    mode,
    target: ["web", "es2020"],
    entry: "./src/index.ts",
    output: {
        filename: "Glotus_Client.user.js",
        path: path.resolve(__dirname, isProd ? "build" : "dist"),
        clean: true
    },
    resolve: {
        extensions: [".js", ".ts", ".scss"],
    },
    optimization: {
        minimizer: [
            new Terser({
                terserOptions: {
                    compress: {
                        defaults: false,
                        unused: true,
                        dead_code: true,
                        hoist_funs: true,
                        hoist_props: true,
                        hoist_vars: true,
                        keep_infinity: true,
                        passes: 3,
                    },
                    mangle: false,
                    parse: false,
                    format: {
                        beautify: true,
                        braces: true,
                    },
                    keep_classnames: true,
                    keep_fnames: true,
                    module: false,
                }
            })
        ]
    },
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    plugins,
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    "raw-loader",
                    "sass-loader"
                ]
            },
            {
                test: /\.html$/,
                use: "html-loader"
            }
        ]
    }
}