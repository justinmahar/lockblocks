module.exports = {
  // The root of your source code, typically /src
  // `<rootDir>` is a token Jest substitutes
  roots: ['<rootDir>/src'],

  // Jest transformations -- this adds support for TypeScript
  // using ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Test spec file resolution pattern
  // - Matches parent folder `__tests__`
  // - Ends with `.test.ts` or `.spec.ts`.
  testRegex: '/__tests__/(.*?)\\.(test|spec)\\.ts$',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};
