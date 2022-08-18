module.exports = {
  configureWebpack: {
    devtool: 'cheap-module-source-map',
    output: {
      globalObject: 'this',
      filename: "[name].js",
      chunkFilename: "[name].js",
    }
  },

  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup'
    },
    standalone: {
      template: 'public/browser-extension.html',
      entry: './src/standalone/main.js',
      title: 'Standalone',
      filename: 'index.html'
    }
  },

  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
      },
      extensionReloaderOptions: {
        reloadPage: false,
      },
    }
  },

  transpileDependencies: [
    'vuetify'
  ]
}
