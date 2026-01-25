-- Reconciliation helper SQL
-- Instructions:
-- 1) Open Supabase SQL Editor (server-side) and review each SELECT result.
-- 2) After backing up your DB, copy the generated transactional statements and run them.
-- 3) Prefer running the SELECTs first to confirm affected rows.

-- 1) Duplicate emails in `public.users` (shows row ids + created_at)
SELECT
  email,
  COUNT(*) AS cnt,
  json_agg(json_build_object('id', id, 'created_at', created_at) ORDER BY created_at) AS rows
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- 2) Profiles that have no matching auth user (profile exists but no auth record)
SELECT p.id, p.email, p.created_at
FROM public.users p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL
ORDER BY p.created_at DESC;

-- 3) Auth users that have no `public.users` profile (auth exists but profile missing)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4) Auth/profile mismatches by email (same email, different ids)
SELECT u.id  AS auth_id,
       p.id  AS profile_id,
       u.email
FROM auth.users u
JOIN public.users p ON u.email = p.email
WHERE u.id <> p.id
ORDER BY u.email;

-- 5) Bills count per user (quick view of affected rows)
SELECT user_id, COUNT(*) AS bills_count
FROM public.bills
GROUP BY user_id
ORDER BY bills_count DESC
LIMIT 100;

-- 6) Generate transactional SQL statements to reconcile auth/profile rows that share an email but have different ids.
--    Review the output, then run the generated BEGIN/UPDATE/INSERT/DELETE/COMMIT blocks in the SQL editor.
SELECT
  'BEGIN; ' ||
  'UPDATE public.bills SET user_id = ''' || u.id || ''' WHERE user_id = ''' || p.id || '''; ' ||
  'INSERT INTO public.users (id,email,is_premium,available_money,created_at) ' ||
  'SELECT ''' || u.id || ''',''' || replace(u.email, '''', '''''') || ''',' || COALESCE(p.is_premium::text,'false') || ',' || COALESCE(p.available_money::text,'0.00') || ', NOW() ' ||
  'WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = ''' || u.id || '''); ' ||
  'DELETE FROM public.users WHERE id = ''' || p.id || ''' AND NOT EXISTS (SELECT 1 FROM public.bills b WHERE b.user_id = ''' || p.id || '''); ' ||
  'COMMIT;' AS sql_statement
FROM auth.users u
JOIN public.users p ON u.email = p.email
WHERE u.id <> p.id;

-- 7) Generate INSERT statements for auth users that lack a public.users profile
SELECT
  'INSERT INTO public.users (id,email,is_premium,available_money,created_at) VALUES (''' ||
  u.id || ''',''' || replace(u.email, '''', '''''') || ''',false,0.00,NOW()) ON CONFLICT (id) DO NOTHING;'
  AS sql_statement
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE p.id IS NULL;

-- 8) Optional: list affected profile rows (for backup/review)
SELECT p.*
FROM public.users p
JOIN auth.users u ON u.email = p.email
WHERE u.id <> p.id;

-- End of script
