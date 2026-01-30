/** Jest config for TypeScript using ts-jest */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.spec.(ts|js)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/tests/setupJest.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
