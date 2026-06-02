const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const defaultConfig = getDefaultConfig(projectRoot)

/**
 * Monorepo support — let Metro see source in `packages/*` and reuse the root
 * `node_modules` plus the app's own.
 */
const config = mergeConfig(defaultConfig, {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    disableHierarchicalLookup: true,
    unstable_enableSymlinks: true,
  },
})

module.exports = config
