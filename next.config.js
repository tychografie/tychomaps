module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('_http_common')
    }
    config.module.rules.push({
      test: /\.txt$/,
      use: 'raw-loader',
    })
    return config
  },
}
