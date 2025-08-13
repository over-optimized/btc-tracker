# Git Workflow & Development Standards

## Feature Branch Workflow

**ALWAYS create a new feature branch when working on any new feature or task:**

```bash
# 1. FIRST: Check for any uncommitted changes on current branch
git status

# 2. If there are changes, commit and push them first
git add .
git commit -m "type: brief description of changes"
git push origin current-branch-name

# 3. Switch to main/staging and pull latest
git checkout main  # or staging
git pull origin main  # or staging

# 4. Create and switch to new feature branch
git checkout -b feature/descriptive-feature-name

# 5. Work on your feature...
# 6. When ready, commit and push
git add .
git commit -m "feat: implement feature description"
git push origin feature/descriptive-feature-name
```

## Branch Management Standards

### 1. Pre-Branch Checklist

- ✅ Check `git status` for uncommitted changes
- ✅ Commit any pending work with descriptive messages
- ✅ Push current branch before switching
- ✅ Pull latest changes from target base branch

### 2. Branch Naming Convention

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions

### 3. Branch Hygiene

- Keep branches focused on single features/fixes
- Regularly sync with base branch to avoid conflicts
- Delete feature branches after merging to keep repo clean

## Commit Message Standards

**Use conventional commit format WITHOUT Co-Authored signatures:**

```bash
# ✅ CORRECT FORMAT
git commit -m "feat: add transaction classification modal with legal disclaimers

- Implement collapsible legal disclaimer for mobile
- Add IRS publication references and research links
- Include user acknowledgment requirements for tax-related actions
- Test modal layout across different screen sizes"

# ❌ AVOID Co-Authored signatures (unnecessary for this project)
# Do NOT include: Co-Authored-By: Claude <noreply@anthropic.com>
```

### Commit Types

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `style:` - Code formatting changes
- `chore:` - Build/tooling changes

## Quality Gate Compliance

**NEVER use `--no-verify` flag to bypass quality checks:**

```bash
# ✅ CORRECT - Let hooks validate your code
git push origin feature-branch

# ❌ INCORRECT - Bypasses quality standards
git push origin feature-branch --no-verify
```

### Pre-Push Requirements (Enforced by Husky)

- ✅ ESLint must pass (0 critical errors)
- ✅ All unit tests must pass (Vitest)
- ✅ Coverage thresholds must be met
- ✅ TypeScript compilation must succeed

### If push fails

1. Fix the reported issues
2. Run quality checks locally: `pnpm quality`
3. Commit fixes and push again
4. **Never** use `--no-verify` to bypass

## End-to-End Testing Requirements

**After completing any feature, run Playwright tests locally:**

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests locally after feature completion
pnpm test:e2e                 # All tests headless
pnpm test:e2e:headed         # Watch tests run in browser
pnpm test:e2e:ui             # Interactive test runner
pnpm test:e2e:debug          # Debug specific tests

# Generate and view test reports
pnpm test:e2e:report
```

### E2E Testing Standards

- ✅ Run locally after completing features
- ✅ Fix any failing E2E tests before creating PR
- ✅ E2E tests may not run in CI pipeline but are required for validation
- ✅ Take screenshots for compliance review when needed

## Quality Verification Workflow

**Before creating any PR, verify your changes meet standards:**

```bash
# 1. Run comprehensive quality checks
pnpm quality                 # ESLint + unit tests + coverage

# 2. Run full CI pipeline locally
pnpm ci                      # ESLint + tests + build

# 3. Run E2E tests for feature validation
pnpm test:e2e               # End-to-end testing

# 4. Only after all pass, create PR
git push origin feature-branch
```

## Quality Gate Requirements (NO EXCEPTIONS)

- ✅ ESLint: 0 critical errors (warnings acceptable)
- ✅ Unit Tests: All 200+ tests must pass
- ✅ Coverage: Meet thresholds (75% overall, 85% hooks, 95% tax utils)
- ✅ TypeScript: No compilation errors
- ✅ Build: Production build must succeed

## Branch Quality Standards

- Never use `--no-verify` to bypass hooks
- Fix quality issues before pushing
- Run `pnpm quality` locally before any push
- Complete E2E testing after feature implementation
