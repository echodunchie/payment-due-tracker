#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Backup and restore Supabase PostgreSQL database using pg_dump/pg_restore.

.DESCRIPTION
    This script creates a backup of your Supabase database and optionally restores it.
    Requires PostgreSQL client tools (pg_dump, pg_restore, psql) installed.

.PARAMETER Action
    Action to perform: 'backup', 'restore', or 'partial'

.PARAMETER ConnectionString
    PostgreSQL connection string from Supabase Settings → Database
    Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

.PARAMETER BackupFile
    Path to backup file (default: backup-YYYYMMDD-HHMMSS.dump)

.PARAMETER RestoreConnectionString
    Connection string for restore target (for restore action)

.EXAMPLE
    # Full backup
    .\scripts\backup-db.ps1 -Action backup -ConnectionString "postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres"

    # Partial backup (critical tables only)
    .\scripts\backup-db.ps1 -Action partial -ConnectionString "postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres"

    # Restore to staging
    .\scripts\backup-db.ps1 -Action restore -BackupFile "backup-20260207-123000.dump" -RestoreConnectionString "postgresql://postgres:staging_password@staging_host:5432/staging_db"
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('backup', 'restore', 'partial')]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString,
    
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
    
    [Parameter(Mandatory=$false)]
    [string]$RestoreConnectionString
)

# Set default backup filename with timestamp
if (-not $BackupFile) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $BackupFile = "backup-$timestamp.dump"
}

# Validate pg_dump availability
try {
    $null = Get-Command pg_dump -ErrorAction Stop
    Write-Host "[OK] pg_dump found" -ForegroundColor Green
} catch {
    Write-Error "pg_dump not found. Install PostgreSQL client tools first."
    Write-Host "Windows: Download from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Or via chocolatey: choco install postgresql" -ForegroundColor Yellow
    exit 1
}

switch ($Action) {
    'backup' {
        if (-not $ConnectionString) {
            Write-Error "ConnectionString is required for backup"
            exit 1
        }
        
        Write-Host "Creating full database backup..." -ForegroundColor Cyan
        Write-Host "File: $BackupFile" -ForegroundColor Gray
        
        pg_dump --format=custom --compress=9 --verbose --file="$BackupFile" --dbname="$ConnectionString"
        
        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item $BackupFile).Length
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Host "[OK] Backup completed successfully: $BackupFile ($sizeMB MB)" -ForegroundColor Green
        } else {
            Write-Error "Backup failed with exit code $LASTEXITCODE"
            exit 1
        }
    }
    
    'partial' {
        if (-not $ConnectionString) {
            Write-Error "ConnectionString is required for partial backup"
            exit 1
        }
        
        $partialFile = $BackupFile.Replace('.dump', '-partial.sql')
        Write-Host "Creating partial backup (critical tables only)..." -ForegroundColor Cyan
        Write-Host "File: $partialFile" -ForegroundColor Gray
        
        # Backup critical tables only
        pg_dump --verbose --table=public.users --table=public.bills --file="$partialFile" --dbname="$ConnectionString"
        
        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item $partialFile).Length
            $sizeKB = [math]::Round($size / 1KB, 2)
            Write-Host "[OK] Partial backup completed: $partialFile ($sizeKB KB)" -ForegroundColor Green
        } else {
            Write-Error "Partial backup failed with exit code $LASTEXITCODE"
            exit 1
        }
    }
    
    'restore' {
        if (-not (Test-Path $BackupFile)) {
            Write-Error "Backup file not found: $BackupFile"
            exit 1
        }
        
        if (-not $RestoreConnectionString) {
            Write-Error "RestoreConnectionString is required for restore"
            exit 1
        }
        
        Write-Host "WARNING: This will overwrite the target database!" -ForegroundColor Red
        $confirm = Read-Host "Type 'YES' to continue"
        if ($confirm -ne 'YES') {
            Write-Host "Restore cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        Write-Host "Restoring database..." -ForegroundColor Cyan
        
        if ($BackupFile.EndsWith('.sql')) {
            # SQL file restore
            psql --dbname="$RestoreConnectionString" --file="$BackupFile"
        } else {
            # Custom format restore
            pg_restore --verbose --clean --if-exists --dbname="$RestoreConnectionString" "$BackupFile"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Restore completed successfully" -ForegroundColor Green
        } else {
            Write-Error "Restore failed with exit code $LASTEXITCODE"
            exit 1
        }
    }
}

Write-Host "Database operation completed." -ForegroundColor Green