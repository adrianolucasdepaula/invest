module.exports = function (options, webpack) {
  // Get existing externals (might be array or object)
  const existingExternals = options.externals || [];
  const newExternals = Array.isArray(existingExternals)
    ? existingExternals
    : [existingExternals];

  return {
    ...options,
    externals: [
      ...newExternals,
      // Mark Playwright as external to avoid bundling SVG assets
      {
        'playwright': 'commonjs2 playwright',
        'playwright-core': 'commonjs2 playwright-core',
        '@mapbox/node-pre-gyp': 'commonjs2 @mapbox/node-pre-gyp',
        'bcrypt': 'commonjs2 bcrypt',
      },
    ],
    module: {
      ...options.module,
      exprContextCritical: false,
    },
  };
};
