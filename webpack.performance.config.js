const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

/**
 * Performance-optimized webpack configuration for the event creation module
 */
module.exports = {
    // Enable code splitting
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                // Vendor libraries
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10,
                    reuseExistingChunk: true,
                },

                // Event creation specific code
                eventCreation: {
                    test: /[\\/]src[\\/](features[\\/]dashboard|components[\\/](ImageUpload|TicketManagement|LocationSelector|OrganizerDetails|DateTimeSelector))/,
                    name: 'event-creation',
                    chunks: 'all',
                    priority: 20,
                    minSize: 20000,
                    maxSize: 200000,
                },

                // Form components
                formComponents: {
                    test: /[\\/]src[\\/]components[\\/](.*Form|.*Selector|.*Input)/,
                    name: 'form-components',
                    chunks: 'all',
                    priority: 15,
                    minSize: 10000,
                },

                // Services and utilities
                services: {
                    test: /[\\/]src[\\/](lib[\\/]services|hooks)/,
                    name: 'services',
                    chunks: 'all',
                    priority: 12,
                    minChunks: 2,
                },

                // Common utilities
                common: {
                    test: /[\\/]src[\\/](lib|utils)[\\/]/,
                    name: 'common',
                    chunks: 'all',
                    priority: 5,
                    minChunks: 2,
                    maxSize: 100000,
                },

                // UI components
                ui: {
                    test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
                    name: 'ui-components',
                    chunks: 'all',
                    priority: 8,
                    minSize: 5000,
                },
            },
        },

        // Enable tree shaking
        usedExports: true,
        sideEffects: false,

        // Minimize bundle size
        minimize: true,

        // Runtime chunk for better caching
        runtimeChunk: {
            name: 'runtime',
        },
    },

    // Performance budgets
    performance: {
        maxAssetSize: 250000, // 250KB
        maxEntrypointSize: 400000, // 400KB
        hints: 'warning',
        assetFilter: function (assetFilename) {
            // Only check JS and CSS files
            return /\.(js|css)$/.test(assetFilename);
        },
    },

    // Module resolution optimizations
    resolve: {
        // Prefer ES modules for better tree shaking
        mainFields: ['module', 'main'],

        // Alias for commonly used modules
        alias: {
            '@components': path.resolve(__dirname, 'src/components'),
            '@hooks': path.resolve(__dirname, 'src/hooks'),
            '@services': path.resolve(__dirname, 'src/lib/services'),
            '@utils': path.resolve(__dirname, 'src/lib/utils'),
        },

        // Reduce module resolution time
        modules: ['node_modules'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    // Plugins for optimization
    plugins: [
        // Bundle analyzer (only in development)
        ...(process.env.ANALYZE === 'true'
            ? [
                  new BundleAnalyzerPlugin({
                      analyzerMode: 'static',
                      openAnalyzer: false,
                      reportFilename: 'bundle-report.html',
                  }),
              ]
            : []),

        // Gzip compression
        new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
        }),
    ],

    // Module rules for optimization
    module: {
        rules: [
            // TypeScript/JavaScript optimization
            {
                test: /\.(ts|tsx|js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        modules: false, // Preserve ES modules for tree shaking
                                        useBuiltIns: 'usage',
                                        corejs: 3,
                                    },
                                ],
                                '@babel/preset-react',
                                '@babel/preset-typescript',
                            ],
                            plugins: [
                                // Dynamic imports for code splitting
                                '@babel/plugin-syntax-dynamic-import',

                                // Remove unused imports
                                [
                                    'babel-plugin-transform-imports',
                                    {
                                        lodash: {
                                            transform: 'lodash/${member}',
                                            preventFullImport: true,
                                        },
                                        'date-fns': {
                                            transform: 'date-fns/${member}',
                                            preventFullImport: true,
                                        },
                                    },
                                ],
                            ],
                        },
                    },
                ],
            },

            // CSS optimization
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                auto: true,
                                localIdentName:
                                    '[name]__[local]--[hash:base64:5]',
                            },
                        },
                    },
                    'postcss-loader',
                ],
            },

            // Image optimization
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192, // 8KB
                            name: 'images/[name].[hash:8].[ext]',
                        },
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            mozjpeg: {
                                progressive: true,
                                quality: 80,
                            },
                            optipng: {
                                enabled: false,
                            },
                            pngquant: {
                                quality: [0.65, 0.9],
                                speed: 4,
                            },
                            gifsicle: {
                                interlaced: false,
                            },
                            webp: {
                                quality: 80,
                            },
                        },
                    },
                ],
            },
        ],
    },

    // Development server optimizations
    devServer: {
        compress: true,
        hot: true,
        overlay: {
            warnings: false,
            errors: true,
        },
    },

    // Source map configuration
    devtool:
        process.env.NODE_ENV === 'production'
            ? 'source-map'
            : 'eval-source-map',

    // Cache configuration for faster rebuilds
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename],
        },
    },

    // Externals for CDN resources
    externals: {
        // Use CDN versions of large libraries in production
        ...(process.env.NODE_ENV === 'production'
            ? {
                  react: 'React',
                  'react-dom': 'ReactDOM',
              }
            : {}),
    },
};

// Next.js specific configuration
const nextConfig = {
    // Enable experimental features
    experimental: {
        // Modern JavaScript features
        esmExternals: true,

        // Optimize CSS
        optimizeCss: true,

        // Enable SWC minification
        swcMinify: true,
    },

    // Webpack configuration
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Apply performance optimizations
        if (!dev && !isServer) {
            // Merge with our performance config
            config.optimization = {
                ...config.optimization,
                ...module.exports.optimization,
            };

            // Add performance budgets
            config.performance = module.exports.performance;

            // Add compression plugin
            config.plugins.push(
                new CompressionPlugin({
                    algorithm: 'gzip',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 8192,
                    minRatio: 0.8,
                })
            );
        }

        // Bundle analyzer in development
        if (dev && process.env.ANALYZE === 'true') {
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'server',
                    openAnalyzer: true,
                })
            );
        }

        return config;
    },

    // Image optimization
    images: {
        domains: ['ucarecdn.com'],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    },

    // Compression
    compress: true,

    // PWA configuration for better performance
    pwa: {
        dest: 'public',
        register: true,
        skipWaiting: true,
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/ucarecdn\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'uploadcare-images',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                    },
                },
            },
        ],
    },
};

module.exports = nextConfig;
