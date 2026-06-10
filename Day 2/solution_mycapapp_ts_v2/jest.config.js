/** @type {import('jest').Config} */
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: { module: 'CommonJS', target: 'ES2022' }   // ← add target: 'ES2022'
    }]
  }
}