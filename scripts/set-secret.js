#!/usr/bin/env node
/*
  Usage:
    node scripts/set-secret.js --owner=OWNER --repo=REPO --name=STAGING_URL --value=https://staging.example.com --token=GH_TOKEN

  Or set env var `GITHUB_TOKEN` and omit `--token`.

  This script fetches the repository public key, encrypts the secret value using
  `tweetsodium` sealed box, then uploads the secret via the Actions Secrets API.
  Token needs `repo` and `actions:write`/`secrets` permissions.
*/

const sodium = require('libsodium-wrappers');

function parseArg(name) {
  const pref = `--${name}=`;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(pref)) return a.slice(pref.length);
  }
  return undefined;
}

const owner = parseArg('owner') || process.env.GITHUB_OWNER;
const repo = parseArg('repo') || process.env.GITHUB_REPO;
const name = parseArg('name');
const value = parseArg('value');
const token = parseArg('token') || process.env.GITHUB_TOKEN;

if (!owner || !repo || !name || !value || !token) {
  console.error('Missing required argument. Usage:');
  console.error('--owner=OWNER --repo=REPO --name=SECRET_NAME --value=SECRET_VALUE --token=GH_TOKEN');
  process.exit(1);
}

async function run() {
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'set-secret-script',
  };

  const publicKeyRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, { headers });
  if (!publicKeyRes.ok) {
    console.error('Failed to fetch public key:', publicKeyRes.status, await publicKeyRes.text());
    process.exit(1);
  }
  const { key, key_id } = await publicKeyRes.json();

  // Initialise libsodium and perform sealed-box encryption
  await sodium.ready;
  const sodiumLib = sodium;
  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(key, 'base64');

  const encryptedBytes = sodiumLib.crypto_box_seal(messageBytes, keyBytes);
  const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

  const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id }),
  });

  if (!putRes.ok) {
    console.error('Failed to create secret:', putRes.status, await putRes.text());
    process.exit(1);
  }

  console.log(`Secret ${name} set for ${owner}/${repo}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
