module.exports = {
    extends: ['@commitlint/config-conventional'],
    parserPreset: {
        parserOpts: {
            issuePrefixes: ['#'],
        },
    },
    rules: {
        'references-empty': [2, 'never'],
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
        ],
        'subject-case': [2, 'always', 'lower-case'],
        'subject-empty': [2, 'never'],
    },
};
