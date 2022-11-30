module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  verbose: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'tests/helpers',
    'tests/fixture',
  ],
}
