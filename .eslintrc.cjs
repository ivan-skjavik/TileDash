module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'space-in-parens': ['error', 'always'],
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': ['off'],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'off',
    'array-bracket-spacing'     : [
			'error',
			'always',
		],
    'comma-spacing' : 'error',
    'comma-dangle' : [
			'warn',
			{
				arrays    : 'always',
				objects   : 'always',
				imports   : 'ignore',
				exports   : 'always',
				functions : 'never',
			},
		],
    indent         : [
			'warn',
			'tab',
			{
				SwitchCase       : 1,
				MemberExpression : 1,
				ArrayExpression  : 1,
				ObjectExpression : 1,
			},
		],
  }
};
