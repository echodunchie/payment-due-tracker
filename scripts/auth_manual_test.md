# Manual Auth Test Checklist

Prerequisites
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in your environment (or in a `.env` file loaded by your shell).
- Start the dev server: `npm run dev` and open http://localhost:3000

Primary checks
1. UI sign-up
   - Open the signup page and register a new user.
   - Observe console logs for `[SUPABASE AUTH]` messages in the browser/terminal.
   - Verify Supabase Auth shows the user.
   - Verify `users` row exists in Supabase `public.users` with `id` matching the auth user and `available_money` present.

2. UI sign-in
   - Sign out, then sign back in with the same credentials.
   - Confirm `getCurrentUser()` returns a valid profile and no "Cannot coerce" errors appear.

3. Orphaned profile reconciliation (simulate)
   - Create an auth user via Supabase Auth directly (Supabase UI) without a `users` row.
   - Sign in via the app using that email; confirm reconciliation logs appear and a `users` row is created or upserted.
   - If you have an existing `users` row with the same email but different id, confirm bills are transferred to the auth id after sign-in.

4. Available money persistence
   - While signed in, update available money in the app UI.
   - Confirm `available_money` saved in `public.users` and reload the app to see the value reloaded.

5. Edge cases
   - Attempt repeated registration for the same email to ensure duplicate-key errors do not crash the app.
   - Verify that multiple rows for the same id/email do not cause `.single()` errors (observe the logs added).

Using the Node test template
- Install dependencies:

```bash
npm install @supabase/supabase-js
# optionally for TypeScript runner:
npm install -D ts-node typescript @types/node
```

- Run the template with `npx ts-node scripts/auth_test_template.ts` or compile to JS and run with `node`.

Notes
- The script uses your `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables.
- If you want, I can create a dry-run admin reconciliation script next (item 3).
