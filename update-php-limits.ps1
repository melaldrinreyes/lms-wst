# PHP Upload Limits Configuration Script
# Run this script as Administrator

Write-Host "=== PHP Upload Limits Configuration ===" -ForegroundColor Cyan
Write-Host ""

$phpIniPath = "C:\xampp\php\php.ini"

if (!(Test-Path $phpIniPath)) {
    Write-Host "ERROR: php.ini not found at $phpIniPath" -ForegroundColor Red
    Write-Host "Please locate your php.ini file and update it manually" -ForegroundColor Yellow
    exit
}

Write-Host "Found php.ini at: $phpIniPath" -ForegroundColor Green
Write-Host ""
Write-Host "Creating backup..." -ForegroundColor Yellow

# Create backup
$backupPath = "$phpIniPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $phpIniPath $backupPath
Write-Host "Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

# Read the file
$content = Get-Content $phpIniPath

# Settings to update
$settings = @{
    'upload_max_filesize' = '512M'
    'post_max_size' = '520M'
    'max_execution_time' = '600'
    'max_input_time' = '600'
    'memory_limit' = '512M'
}

Write-Host "Updating php.ini settings..." -ForegroundColor Yellow
Write-Host ""

$modified = $false
$newContent = @()

foreach ($line in $content) {
    $updated = $false
    
    foreach ($setting in $settings.Keys) {
        # Check if line contains this setting (uncommented)
        if ($line -match "^$setting\s*=") {
            $newContent += "$setting = $($settings[$setting])"
            Write-Host "✓ Updated: $setting = $($settings[$setting])" -ForegroundColor Green
            $updated = $true
            $modified = $true
            break
        }
        # Check if line contains this setting (commented)
        elseif ($line -match "^;\s*$setting\s*=") {
            $newContent += "$setting = $($settings[$setting])"
            Write-Host "✓ Uncommented and updated: $setting = $($settings[$setting])" -ForegroundColor Green
            $updated = $true
            $modified = $true
            break
        }
    }
    
    if (!$updated) {
        $newContent += $line
    }
}

if ($modified) {
    # Write the new content
    $newContent | Set-Content $phpIniPath -Encoding UTF8
    Write-Host ""
    Write-Host "=== Configuration Updated Successfully ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You MUST restart Apache now!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Open XAMPP Control Panel" -ForegroundColor White
    Write-Host "2. Click 'Stop' on Apache" -ForegroundColor White
    Write-Host "3. Wait 3 seconds" -ForegroundColor White
    Write-Host "4. Click 'Start' on Apache" -ForegroundColor White
    Write-Host ""
    Write-Host "Then visit: http://localhost/lms-app/backend-laravel/public/check-upload-limits.php" -ForegroundColor Cyan
    Write-Host "to verify the changes took effect" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "WARNING: Settings not found in php.ini" -ForegroundColor Yellow
    Write-Host "You may need to add these settings manually" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
