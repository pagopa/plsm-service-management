import type { Config } from "jest";

const config: Config = {
  clearMocks: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
};

export default config;
