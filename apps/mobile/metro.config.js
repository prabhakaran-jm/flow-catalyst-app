// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');

// Pre-require expo-asset to ensure it's available when @expo/metro-config tries to require it
// This is needed for pnpm workspaces where module resolution can be isolated
try {
  require.resolve('expo-asset', { paths: [__dirname, path.join(__dirname, '../..')] });
  // Pre-load it into the require cache
  require('expo-asset');
} catch (e) {
  // If expo-asset can't be resolved, try alternative paths
  const workspaceRoot = path.resolve(__dirname, '../..');
  const possiblePaths = [
    path.join(__dirname, 'node_modules', 'expo-asset'),
    path.join(workspaceRoot, 'node_modules', 'expo-asset'),
  ];
  
  for (const tryPath of possiblePaths) {
    try {
      require(tryPath);
      break;
    } catch (e2) {
      // Continue to next path
    }
  }
}

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver for pnpm workspace compatibility
if (config.resolver) {
  // Add workspace node_modules to resolution paths for pnpm compatibility
  const workspaceRoot = path.resolve(__dirname, '../..');
  const nodeModulesPaths = [
    path.join(__dirname, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
  ];
  
  // Ensure nodeModulesPaths includes workspace root for pnpm
  if (!config.resolver.nodeModulesPaths) {
    config.resolver.nodeModulesPaths = nodeModulesPaths;
  } else {
    config.resolver.nodeModulesPaths = [
      ...new Set([...config.resolver.nodeModulesPaths, ...nodeModulesPaths]),
    ];
  }

  // Add path aliases for @ imports
  config.resolver.alias = {
    ...config.resolver.alias,
    '@': __dirname,
    '@/src': `${__dirname}/src`,
    '@/lib': `${__dirname}/lib`,
    '@/theme': `${__dirname}/theme`,
  };
}

module.exports = config;
