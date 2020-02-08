const merge = require("lodash.merge");

let baseConfig = {
  outputDir: undefined,
  // assetsDir: undefined,
  // publicPath:'/static',
  configureWebpack: {
    // 默认执行 npm run serve 和 npm run build 进行单页面打包 
    // 但是已经不是默认 vue-cli 的 src/main.js 这里提提供了默认入口
    entry: './src/entry-client.js',
  }
}

function buildForClient() {
  // env from .env file
  return process.env.BUILD_TARGET === 'CLIENT';
}

function buildForServer() {
  // env from .env.server file
  return process.env.BUILD_TARGET === 'SERVER';
}

function runInProduction() {
  return process.env.NODE_ENV === 'production';
}

if (buildForClient() && runInProduction()) {

  const VueSSRClientPlugin = require('vue-server-renderer/client-plugin');

  baseConfig = merge(baseConfig, {
    outputDir: './dist/client',
    css: {
      // see https://github.com/vuejs/vue/issues/9194#issuecomment-473873303
      // to get why set sourceMap to true
      // possible reason https://github.com/vuejs/vue/issues/9488#issuecomment-514985110
      sourceMap: true,
    },
    configureWebpack: {
      entry: './src/entry-client.js',
      target: 'web',
      optimization: {
        // see https://ssr.vuejs.org/guide/build-config.html#client-config
        runtimeChunk: {
          name: 'manifest'
        }
      },
      plugins: [
        new VueSSRClientPlugin()
      ]
    }
  });

}

if (buildForServer() && runInProduction()) {

  const VueSSRServerPlugin = require('vue-server-renderer/server-plugin');
  const nodeExternalsNode = require('webpack-node-externals');

  baseConfig = merge(baseConfig, {
    outputDir: './dist/server',
    css: {
      // to disabled mini-css-extract-plugin in production
      // see https://github.com/webpack-contrib/mini-css-extract-plugin/issues/90
      extract: false
    },
    configureWebpack: {
      entry: './src/entry-server.js',
      // 这允许 webpack 以 Node 适用方式(Node-appropriate fashion)处理动态导入(dynamic import)，
      // 并且还会在编译 Vue 组件时，
      // 告知 `vue-loader` 输送面向服务器代码(server-oriented code)。
      target: 'node',
      // 对 bundle renderer 提供 source map 支持
      devtool: 'source-map',
      // 此处告知 server bundle 使用 Node 风格导出模块(Node-style exports)
      output: {
        libraryTarget: 'commonjs2'
      },
      // 外置化应用程序依赖模块。可以使服务器构建速度更快，
      // 并生成较小的 bundle 文件。
      externals: nodeExternalsNode({
        whitelist: [/\.css$/, /\?vue&type=style/]
      }),
      // see https://ssr.vuejs.org/guide/build-config.html#client-config
      // this is reason why to disalbe splitChunks
      optimization: {
        splitChunks: false
      },
      plugins: [
        new VueSSRServerPlugin()
      ]
    },
    chainWebpack: config => {
      const langs = ["css", "postcss", "scss", "sass", "less", "stylus"];
      const types = ["vue-modules", "vue", "normal-modules", "normal"];
      for (const lang of langs) {
        for (const type of types) {
          try {
            let rule;
            console.warn(rule = config.module.rule(lang).oneOf(type));
            rule.clear().use('null-loader');
            
          } catch (error) {
            console.warn(error);
            
          }
        }
      }
    }
  });
}

module.exports = baseConfig;