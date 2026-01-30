# Staging Deploy Checklist

1. Build the app locally to verify it compiles:

```bash
npm ci
npm run build
```

2. Deploy to your staging host (Vercel recommended for Next.js). Set environment variables on staging:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any other keys required by your app (Stripe keys later, etc.)

3. Configure a `STAGING_URL` secret in CI for smoke tests (e.g., `https://staging.example.com`).

4. Install Playwright browsers on the runner (if not using Playwright's official action):

```bash
npx playwright install --with-deps
```

5. Run smoke tests locally (optional):

```bash
STAGING_URL=https://staging.example.com npm run test:smoke
```

6. Add a CI job to run smoke tests after staging deploy (example GitHub Actions step):

```yaml
- name: Run smoke tests
  env:
    STAGING_URL: ${{ secrets.STAGING_URL }}
  run: |
    npx playwright install --with-deps
    npm run test:smoke
```
7. Verify core flows manually if needed (signup, login, add bill, date handling).

"Done" when smoke tests pass and core flows are verified.

## Protecting `main` with smoke tests

1. Go to the repository Settings → Branches → Branch protection rules.
2. Add or edit a rule for `main`.
3. Under "Require status checks to pass before merging", add the workflow check name shown in PR checks (e.g., `pr-smoke` or `Run smoke tests`) after you've run a PR once so GitHub knows the exact check name.
4. Enable the rule to block merges when the smoke tests fail.

Note: The `pr-smoke` workflow will fail if `STAGING_URL` secret is not configured; set `STAGING_URL` under Settings → Secrets → Actions.
```

7. Verify core flows manually if needed (signup, login, add bill, date handling).

"Done" when smoke tests pass and core flows are verified.
