/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['images.unsplash.com'],
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    // Enhanced bundle optimization
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            'chart.js',
            'react-chartjs-2',
        ],
        // Temporarily disable turbo rules to fix font loading
        // turbo: {
        //     rules: {
        //         '*.svg': {
        //             loaders: ['@svgr/webpack'],
        //             as: '*.js',
        //         },
        //     },
        // },
    },
    // Bundle analyzer and optimization
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Optimize bundle splitting
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                ...config.optimization.splitChunks,
                cacheGroups: {
                    ...config.optimization.splitChunks.cacheGroups,
                    // Dashboard-specific chunks
                    dashboard: {
                        name: 'dashboard',
                        test: /[\\/]src[\\/](components|features)[\\/](.*dashboard.*|.*Dashboard.*|.*analytics.*|.*Analytics.*)/i,
                        chunks: 'all',
                        priority: 30,
                        reuseExistingChunk: true,
                    },
                    // Chart.js and visualization libraries
                    charts: {
                        name: 'charts',
                        test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)/,
                        chunks: 'all',
                        priority: 25,
                        reuseExistingChunk: true,
                    },
                    // UI components
                    ui: {
                        name: 'ui',
                        test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
                        chunks: 'all',
                        priority: 20,
                        reuseExistingChunk: true,
                    },
                    // Radix UI components
                    radix: {
                        name: 'radix',
                        test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                        chunks: 'all',
                        priority: 15,
                        reuseExistingChunk: true,
                    },
                    // Lucide icons
                    icons: {
                        name: 'icons',
                        test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                        chunks: 'all',
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                },
            };
        }

        // Tree shaking optimization for chart.js
        config.resolve.alias = {
            ...config.resolve.alias,
            'chart.js': 'chart.js/auto',
        };

        // Bundle analyzer in development
        if (process.env.ANALYZE === 'true') {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            config.plugins.push(
                new BundleAnalyzerPlugin({
                    analyzerMode: 'server',
                    analyzerPort: 8888,
                    openAnalyzer: true,
                })
            );
        }

        return config;
    },
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
    // Environment variables for feature flags
    env: {
        NEXT_PUBLIC_FEATURE_ENHANCED_EVENT_TABLE:
            process.env.NEXT_PUBLIC_FEATURE_ENHANCED_EVENT_TABLE || 'false',
        NEXT_PUBLIC_FEATURE_REGISTRATION_MANAGEMENT:
            process.env.NEXT_PUBLIC_FEATURE_REGISTRATION_MANAGEMENT || 'false',
        NEXT_PUBLIC_FEATURE_REVENUE_REPORTING:
            process.env.NEXT_PUBLIC_FEATURE_REVENUE_REPORTING || 'false',
        NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION:
            process.env.NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION || 'false',
        NEXT_PUBLIC_FEATURE_ATTENDEE_ANALYTICS:
            process.env.NEXT_PUBLIC_FEATURE_ATTENDEE_ANALYTICS || 'false',
        NEXT_PUBLIC_FEATURE_REALTIME_UPDATES:
            process.env.NEXT_PUBLIC_FEATURE_REALTIME_UPDATES || 'false',
    },
};

module.exports = nextConfig;
