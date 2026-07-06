import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

function logAuthResponse(label, status, body) {
  console.log(`\n=== ${label} ===`);
  console.log('HTTP status:', status);
  console.log('Response body:', body);
  try {
    const parsed = JSON.parse(body);
    if (parsed.msg || parsed.message) console.log('Error message:', parsed.msg || parsed.message);
    if (parsed.error_code) console.log('Error code:', parsed.error_code);
    if (parsed.error_id) console.log('Error id:', parsed.error_id);
  } catch {
    // non-json body
  }
}

async function testSignup() {
  const email = `test+${Date.now()}@example.com`;
  const password = 'Str0ng!UniquePwd#2026';
  const fullName = 'Signup Test User';

  console.log('Supabase URL:', url);
  console.log('Attempting signup with', email);

  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName },
    }),
  });

  const body = await res.text();
  logAuthResponse('Raw signup API', res.status, body);

  const clientResult = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  console.log('\n=== supabase-js signUp ===');
  console.log('error:', clientResult.error);
  console.log('user id:', clientResult.data.user?.id ?? null);
  console.log('session:', clientResult.data.session ? 'present' : 'null');

  if (clientResult.data.user?.id) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientResult.data.user.id)
      .maybeSingle();

    console.log('\n=== profiles row ===');
    console.log('profile:', profile);
    console.log('profileError:', profileError);
  }

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260704120000_005_fix_signup_complete.sql');
  console.log('\nIf signup failed, apply this migration in Supabase SQL Editor:');
  console.log(migrationPath);
  console.log('Or run: node scripts/apply_signup_fix.mjs (with SUPABASE_DB_URL or SUPABASE_ACCESS_TOKEN)');
}

testSignup().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
