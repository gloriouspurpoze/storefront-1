const path = require('path');
const fs = require('fs');

const packagesRoot = path.resolve(__dirname, 'packages');

const profixerAliases = {
  '@profixer/types': path.join(packagesRoot, 'types/src'),
  '@profixer/rbac': path.join(packagesRoot, 'rbac/src'),
  '@profixer/constants': path.join(packagesRoot, 'constants/src'),
  '@profixer/api-client': path.join(packagesRoot, 'api-client/src'),
  '@profixer/utils': path.join(packagesRoot, 'utils/src'),
};

// Only the `src/` dirs of every workspace package — NEVER the whole package
// folder, otherwise babel tries to compile each package's nested
// node_modules (thousands of .d.ts files, hangs the dev server).
const packageSrcDirs = fs
  .readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(packagesRoot, entry.name, 'src'))
  .filter((dir) => fs.existsSync(dir));

function includePackagesInBabel(webpackConfig) {
  const includePaths = [path.resolve(__dirname, 'src'), ...packageSrcDirs];

  const addInclude = (rule) => {
    if (!rule) return;
    if (rule.oneOf) {
      rule.oneOf.forEach(addInclude);
      return;
    }
    const loader = rule.loader || (rule.use && rule.use[0] && rule.use[0].loader);
    // Only widen the *app* babel rule (the one that already includes appSrc).
    // Skip the node_modules babel rule, otherwise we'd transpile every dep.
    if (loader && String(loader).includes('babel-loader') && rule.include) {
      const current = Array.isArray(rule.include) ? rule.include : [rule.include];
      const includesAppSrc = current.some(
        (inc) => typeof inc === 'string' && inc.endsWith(`${path.sep}src`),
      );
      if (includesAppSrc) {
        rule.include = [...new Set([...current, ...packageSrcDirs])];
      }
    }
  };

  webpackConfig.module.rules.forEach(addInclude);
  return includePaths;
}

module.exports = {
  webpack: {
    alias: profixerAliases,
    configure: (webpackConfig) => {
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...(webpackConfig.resolve.alias || {}),
          ...profixerAliases,
        },
      };

      // CRA's ModuleScopePlugin blocks imports from outside `src/`. We need it
      // off so files in `packages/*/src` can be imported.
      const scopePluginIndex = webpackConfig.resolve.plugins.findIndex(
        ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin',
      );
      if (scopePluginIndex >= 0) {
        webpackConfig.resolve.plugins.splice(scopePluginIndex, 1);
      }

      includePackagesInBabel(webpackConfig);

      // Keep the type-checker off (we run `tsc --noEmit` separately) — it
      // OOMs on this codebase otherwise.
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin',
      );

      // Skip source-map noise from nested packages' source maps.
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
      ];

      return webpackConfig;
    },
  },
  devServer: {
    compress: true,
    hot: true,
    liveReload: false,
  },
  typescript: {
    enableTypeChecking: false,
  },
};
