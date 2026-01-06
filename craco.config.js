module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Fix for @babel/runtime ESM imports
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fullySpecified: false,
      };

      // Completely remove ForkTsCheckerWebpackPlugin to prevent memory issues and crashes
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      
      // Additional webpack optimizations for memory
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
      
      // Disable source maps in development to save memory
      if (env === 'development') {
        webpackConfig.devtool = false;
      }
      
      return webpackConfig;
    },
  },
  devServer: {
    // Increase memory limit for dev server
    maxMemory: 8192,
    // Additional dev server optimizations
    compress: true,
    hot: true,
    liveReload: false,
  },
  // Add babel configuration for better performance
  babel: {
    plugins: [
      // Add any babel plugins that might help with performance
    ],
  },
  typescript: {
    // Disable type checking during build
    enableTypeChecking: false,
  },
};
