/* eslint-env node */
const path = require('path');

const formatCommand = 'prettier --write';
const lintCommand = 'eslint --fix';
const testCommand = 'pnpm test';

module.exports = {
    '*.{js,jsx,ts,tsx}': [formatCommand, lintCommand, testCommand],
};
