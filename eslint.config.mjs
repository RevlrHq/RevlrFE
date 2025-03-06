import typescriptEslint from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import boundaries from 'eslint-plugin-boundaries';
import tailwindcss from 'eslint-plugin-tailwindcss';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    importPlugin.flatConfigs.recommended,
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/.vercel/**',
            '**/.pnpm-store/**',
            '**/.pnpm/**',
            '**/.yarn/**',
            '**/.yarnrc.yml',
            '**/.yarnrc',
            '**/.yarn-integrity',
            '**/.yarn-metadata.json',
            '**/.yarn-tarball.tgz',
            '**/.yarnignore',
            '**/.yarnrc.yml',
            'src/lib/services/', // ignore our codegen services folder
        ],
    },
    {
        plugins: {
            '@typescript-eslint': typescriptEslint,
            tailwindcss,
        },
        // files: ['**/*.{ts,tsx,js,mjs,cjs}'],
        languageOptions: {
            parser: tsParser,
        },

        rules: {
            'tailwindcss/classnames-order': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
    {
        plugins: {
            boundaries,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: ['./tsconfig.json'],
                },
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                },
            },
            'boundaries/include': ['src/**/*'],
            'boundaries/elements': [
                {
                    mode: 'full',
                    type: 'shared',
                    pattern: [
                        'src/components/*',
                        'src/lib/*',
                        'src/stores/**/*',
                        'src/hooks/**/*',
                        'src/providers/**/*',
                    ],
                },
                {
                    mode: 'full',
                    type: 'tests', // Separate type for tests
                    pattern: ['src/tests/**/*.+(ts|tsx|js|jsx)'],
                },
                {
                    type: 'services', // Separate type for services
                    pattern: ['src/services/**/*'],
                },
                {
                    type: 'ui', // Separate type for UI components
                    pattern: ['src/components/ui/**'],
                },
                {
                    mode: 'full',
                    type: 'feature',
                    capture: ['featureName'],
                    pattern: ['src/features/*/**/*'],
                },
                {
                    mode: 'full',
                    type: 'app',
                    capture: ['_', 'fileName'],
                    pattern: ['src/app/**/*'],
                },
                {
                    mode: 'full',
                    type: 'neverImport',
                    pattern: ['src/app/**/*'],
                },
            ],
        },
        rules: {
            ...boundaries.configs.recommended.rules,
            // Prevent circular dependencies
            'import/no-cycle': 'error',
            // Ensure imports are resolved
            'import/no-unresolved': 'error',
            'boundaries/no-private': 0,
            'boundaries/no-unknown-files': ['error'],
            'boundaries/element-types': [
                2,
                {
                    default: 'disallow',
                    rules: [
                        {
                            from: 'shared',
                            allow: ['shared', 'ui', 'services'],
                        },
                        {
                            from: 'ui',
                            allow: ['ui', 'shared'],
                        },
                        {
                            from: 'tests',
                            allow: ['tests', 'shared', 'feature'],
                        },
                        {
                            from: 'feature',
                            allow: [
                                'shared',
                                'ui',
                                'services',
                                [
                                    'feature',
                                    { featureName: '${from.featureName}' },
                                ],
                            ],
                        },
                        {
                            from: 'app',
                            allow: ['shared', 'ui', 'feature', 'services'],
                        },
                        {
                            from: 'app',
                            allow: [['app', { fileName: '*.css' }]],
                        },
                    ],
                },
            ],
        },
    },
    ...compat.extends('plugin:tailwindcss/recommended', 'prettier'),
    ...compat
        .extends(
            // "next/core-web-vitals",
            'plugin:@typescript-eslint/recommended',
            'plugin:tailwindcss/recommended',
            // 'plugin:boundaries/recommended',
            'prettier'
        )
        .map((config) => ({
            ...config,
            files: ['**/*.ts', '**/*.tsx'],
        })),
    {
        files: ['**/*.ts', '**/*.tsx'],

        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',

            parserOptions: {
                project: ['./tsconfig.json'],
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
];
