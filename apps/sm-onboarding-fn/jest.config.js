module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist', '/node_modules'],

  // 💡 AGGIUNGI questa riga per risolvere il problema del TypeError:
  testEnvironmentOptions: {},
};
