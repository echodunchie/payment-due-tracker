# Database Backup & Deploy Guide

## Quick Backup (5 minutes)

1. Get your Supabase connection string:
   - Go to Supabase Project → Settings → Database
   - Copy "Connection string" (URI format)

2. Run the backup script:
```powershell
# Full backup (recommended for production)
.\scripts\backup-db.ps1 -Action backup -ConnectionString "YOUR_CONNECTION_STRING_HERE"

# OR partial backup (faster, critical tables only)
.\scripts\backup-db.ps1 -Action partial -ConnectionString "YOUR_CONNECTION_STRING_HERE"
```

3. Verify backup file created:
```powershell
Get-ChildItem backup-*.dump
Get-ChildItem backup-*-partial.sql
```

## Deploy Steps

1. **Create release tag:**
```powershell
git tag -a v1.0.0 -m "Release v1.0.0: Payment Due Tracker MVP"
git push origin v1.0.0
```

2. **Deploy to production:**
   - Vercel: Connect your repo, set environment variables, deploy from `main` or `v1.0.0` tag
   - Other hosts: Build with `npm run build` and deploy the `.next` folder

3. **Environment variables for production:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add any Stripe keys later when payment flow is ready

4. **Post-deploy verification:**
```powershell
# Update staging URL to production URL and test
$env:STAGING_URL = "https://your-production-domain.com"
npm run test:smoke
```

5. **Monitor and rollback plan:**
   - Keep the backup file safe
   - Monitor logs for 30-60 minutes
   - Rollback: redeploy previous tag + restore DB if needed

## Restore (if needed)

```powershell
# Restore to staging for testing
.\scripts\backup-db.ps1 -Action restore -BackupFile "backup-20260207-123000.dump" -RestoreConnectionString "postgresql://postgres:staging_password@staging_host:5432/staging_db"
```

## Security Notes

- Never commit connection strings or passwords to git
- Use environment variables for sensitive data
- Delete backup files from local machine after uploading to secure storage
- Consider encrypting backup files for long-term storage