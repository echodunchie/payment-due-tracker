import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function run() {
  const testEmail = `test+${Date.now()}@example.com`
  const testPassword = 'Test1234!'

  console.log('Test email:', testEmail)

  // Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  })

  if (signUpError) {
    console.error('SignUp error:', signUpError.message)
  } else {
    console.log('SignUp response:', signUpData)
  }

  // Sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  if (signInError) {
    console.error('SignIn error:', signInError.message)
    process.exit(1)
  }

  const user = signInData.user
  console.log('Signed in user id:', user?.id)

  // Fetch users profile by id
  const { data: profileById, error: profileByIdErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .maybeSingle()

  if (profileByIdErr) {
    console.error('Profile by id error:', profileByIdErr.message)
  } else {
    console.log('Profile by id:', profileById)
  }

  // Fetch profile by email
  const { data: profileByEmail, error: profileByEmailErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .maybeSingle()

  if (profileByEmailErr) {
    console.error('Profile by email error:', profileByEmailErr.message)
  } else {
    console.log('Profile by email:', profileByEmail)
  }

  // Print session info
  const { data: sessionData } = await supabase.auth.getSession()
  console.log('Session:', sessionData)

  console.log('Manual auth test finished.')
}

run().catch((e) => {
  console.error('Unexpected error:', e)
  process.exit(1)
})
