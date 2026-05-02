import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['dotenv/config'],
    fileParallelism: false,
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/**/_test/**', 'src/app.js'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
