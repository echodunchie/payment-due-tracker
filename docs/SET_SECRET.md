# Setting `STAGING_URL` repository secret via script

This repository includes a helper script to set repository secrets programmatically using the GitHub REST API.

Prerequisites:
- A personal access token (PAT) with `repo` scope and permissions to manage secrets (or an installation token for a GitHub App with appropriate permissions).
- Node.js (v16+).

Usage:

1. Install dev dependencies (to get `tweetsodium`):

```bash
npm ci
```

2. Run the helper script (example):

```bash
node scripts/set-secret.js --owner=echodunchie --repo=payment-due-tracker --name=STAGING_URL --value=https://staging.example.com --token=YOUR_GH_PAT
```

Or set `GITHUB_TOKEN` in the environment and omit `--token`:

```bash
GITHUB_TOKEN=ghp_xxx node scripts/set-secret.js --owner=echodunchie --repo=payment-due-tracker --name=STAGING_URL --value=https://staging.example.com
```

After running successfully, the `STAGING_URL` secret will be available under the repository Settings → Secrets → Actions.

Security note: keep your token secret. Prefer using a GitHub App installation token or GitHub Actions to manage secrets where possible.
