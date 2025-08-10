import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.config.*',
        '**/*.test.*',
        '**/__tests__/**',
        'src/setupTests.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 75,
          statements: 75,
        },
        // Higher thresholds for critical business logic
        'src/utils/taxCalculator.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/utils/taxLotManager.ts': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/hooks/**': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
});
