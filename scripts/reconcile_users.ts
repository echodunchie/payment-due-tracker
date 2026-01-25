import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment')
  process.exit(1)
}

// Use service role if provided, otherwise anonymous client (read-only limited)
const client = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')

async function dryRunReport() {
  console.log('--- Dry-run report: checking `public.users` for duplicates and anomalies ---')

  // Find emails with >1 public.users rows
  const dupRes: any = await client.from('users').select('email,id') ;
  const dupEmails: any[] = dupRes?.data || [] ;

  // Aggregate duplicates locally
  const byEmail: Record<string, any[]> = {} ;
  (dupEmails || []).forEach((r: any) => {
    const e = r.email || '(no-email)'
    byEmail[e] = byEmail[e] || []
    byEmail[e].push(r)
  })

  const duplicates = Object.entries(byEmail).filter(([email, rows]) => (rows as any[]).length > 1)
  if (duplicates.length === 0) {
    console.log('No duplicate emails found in `public.users`.')
  } else {
    console.log('Found duplicate emails in `public.users` (email -> row count):')
    duplicates.forEach(([email, rows]) => console.log(`- ${email} -> ${rows.length} rows`))
  }

  // Check for auth users without public.users if service role is available
  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      console.log('\nService role key present — listing auth users to find missing profiles...')
      // @ts-ignore - admin API may be available
      const listRes: any = await (client as any).auth.admin.listUsers({ per_page: 100 }) ;
      const authUsers: any[] = listRes?.data?.users || listRes?.users || listRes?.data || [] ;
      console.log(`Found ${authUsers.length} auth users.`)

      // Fetch public.users emails map
      const profRes: any = await client.from('users').select('id,email') ;
      const profiles: any[] = profRes?.data || [] ;
      const profilesById = new Set((profiles || []).map((p: any) => p.id))
      const profilesByEmailObj: Record<string, any[]> = {}
      ;(profiles || []).forEach((p: any) => {
        const e = p.email || ''
        profilesByEmailObj[e] = profilesByEmailObj[e] || []
        profilesByEmailObj[e].push(p)
      })

      const missing = (authUsers || []).filter((u: any) => !profilesById.has(u.id))
      console.log(`Found ${missing.length} auth users without a public.users profile.`)
      if (missing.length > 0) console.log('Use --apply with SUPABASE_SERVICE_ROLE_KEY to create/upsert these profiles.')
    } catch (e: any) {
      console.error('Failed to list auth users (admin API) — ensure SUPABASE_SERVICE_ROLE_KEY is correct:', e.message || e)
    }
  } else {
    console.log('\nNo service role key provided — cannot list auth users. To create missing profiles from auth.users, provide SUPABASE_SERVICE_ROLE_KEY and run with --apply.')
  }

  console.log('\nDry-run complete.')
}

async function applyReconcile() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Cannot apply changes without SUPABASE_SERVICE_ROLE_KEY in environment (service_role key).')
    process.exit(1)
  }

  console.log('Applying reconciliation (this will create/upsert profiles and transfer bills where needed)')

  // List auth users
  // @ts-ignore
  const listRes: any = await (client as any).auth.admin.listUsers({ per_page: 100 }) ;
  const authUsersRaw: any = listRes?.data?.users || listRes?.users || listRes?.data || [] ;

  // Load existing profiles
  const profRes2: any = await client.from('users').select('id,email,is_premium,available_money') ;
  const profiles: any[] = profRes2?.data || [] ;
  const profilesById = new Set((profiles || []).map((p: any) => p.id))
  const profilesByEmailObj: Record<string, any[]> = {}
  ;(profiles || []).forEach((p: any) => {
    const e = p.email || ''
    profilesByEmailObj[e] = profilesByEmailObj[e] || []
    profilesByEmailObj[e].push(p)
  })

  const authUsers = Array.isArray(authUsersRaw) ? authUsersRaw : (authUsersRaw?.users || authUsersRaw?.data || [])
  for (let i = 0; i < (authUsers || []).length; i++) {
    const u = authUsers[i]
    if (profilesById.has(u.id)) continue // already present

    const email = u.email || ''
    const existingByEmail = profilesByEmailObj[email] || []

    if (existingByEmail.length > 0) {
      // Reconcile: upsert with auth id, transfer bills from old id(s)
      const source = existingByEmail[0]
      console.log(`Reconciling auth user ${u.id} from existing profile ${source.id} (email ${email})`)

      const { data: upserted, error: upsertErr } = await client
        .from('users')
        .upsert({ id: u.id, email, is_premium: source.is_premium ?? false, available_money: source.available_money ?? 0.00 }, { onConflict: 'email' })
        .select()
        .maybeSingle()

      if (upsertErr) {
        console.error('Upsert failed for', u.id, upsertErr.message)
        continue
      }

      // Transfer bills from source.id -> u.id
      const { error: billsErr } = await client
        .from('bills')
        .update({ user_id: u.id })
        .eq('user_id', source.id)

      if (billsErr) {
        console.error('Failed to transfer bills from', source.id, 'to', u.id, billsErr.message)
        continue
      }

      console.log('Reconciled and transferred bills for', u.id)
    } else {
      // No existing profile by email — create one referencing auth id
      console.log(`Creating profile for auth user ${u.id} (email ${email})`)
      const { data: created, error: createErr } = await client
        .from('users')
        .insert({ id: u.id, email, is_premium: false, available_money: 0.00 })
        .select()
        .maybeSingle()

      if (createErr) {
        console.error('Failed to create profile for', u.id, createErr.message)
        continue
      }

      console.log('Created profile for', u.id)
    }
  }

  console.log('Apply reconciliation complete.')
}

async function main() {
  if (APPLY) {
    await applyReconcile()
  } else {
    await dryRunReport()
  }
}

main().catch((e) => {
  console.error('Unexpected error in reconcile script:', e)
  process.exit(1)
})
