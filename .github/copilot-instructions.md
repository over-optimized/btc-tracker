# 📝 GitHub Copilot Instructions

## Project Context

- **Type:** React + TypeScript (Vite)
- **Features:** Modular UI, CSV import, deduplication, charts (Recharts), routing, localStorage, strong testing setup (Vitest + Testing Library)
- **Testing:** Unit/component tests in `src/components/__tests__` and `src/utils`

---

## Copilot Usage Guidelines

### 1. Testing Workflow

- When adding or editing a component or utility, always add or update a corresponding test file.
- Run tests for individual files after changes (e.g., `pnpm test --run src/components/__tests__/ComponentName.test.tsx`) to quickly verify correctness.
- After a batch of changes, run the full test suite (`pnpm test`) to ensure nothing is broken.
- If a test fails, iterate: read the error, update the test or code, and re-run the test file until it passes.

### 2. Test Structure

- Place all component tests in `src/components/__tests__`.
- Use realistic props and data in tests (e.g., use `new Date()` for date fields, match the `Transaction` interface).
- For chart components, check for chart container classes (e.g., `.recharts-responsive-container`) rather than headings.
- For modal/dialog components, check for both open and closed states.

### 3. Component/Feature Development

- When creating a new feature, start with a minimal test to define expected behavior.
- Use function/regex matchers in tests to handle text split across elements.
- Mock browser APIs (e.g., `ResizeObserver`) in `setupTests.ts` as needed for third-party libraries.

### 4. General Coding Practices

- Prefer small, focused components and utility functions.
- Use TypeScript types/interfaces for all data structures.
- Keep business logic (e.g., parsing, deduplication) in `src/utils` and test thoroughly.
- Use `localStorage` for persistence, but keep the code ready for future backend migration.

### 5. Code Quality

- Run `pnpm lint` and `pnpm format` before committing.
- Maintain high test coverage, especially for core logic and UI components.

---

## Example Test Command Workflow

```sh
# Run a single test file
pnpm test --run src/components/__tests__/ImportSummaryModal.test.tsx

# Run all tests
pnpm test

# View coverage report
open coverage/index.html
```
