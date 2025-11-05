# Fix File Upload Error (422) - Step by Step Guide

## The Error You're Seeing:
```
Error saving: AxiosError {message: 'Request failed with status code 422'}
Error response: {message: 'The file failed to upload.', errors: {…}}
```

This error means the file upload validation failed. Here's how to fix it:

## Quick Fix - Option 1: Update XAMPP PHP.ini (RECOMMENDED)

### Step 1: Run the PowerShell Script
1. **Right-click** on `update-php-limits.ps1`
2. Select **"Run with PowerShell"**
3. If you get a security warning, type `Y` and press Enter
4. The script will automatically update your php.ini file

### Step 2: Restart Apache
1. Open **XAMPP Control Panel**
2. Click **Stop** on Apache
3. Wait 3 seconds
4. Click **Start** on Apache

### Step 3: Verify Changes
Visit this URL in your browser:
```
http://localhost/lms-app/backend-laravel/public/check-upload-limits.php
```

You should see:
```json
{
    "upload_max_filesize": "512M",
    "post_max_size": "520M",
    "max_execution_time": "600",
    "memory_limit": "512M"
}
```

If you still see small values (like "2M" or "8M"), continue to Manual Fix below.

---

## Manual Fix - Option 2: Edit php.ini Manually

### Step 1: Locate php.ini
1. Open **XAMPP Control Panel**
2. Click **Config** button next to Apache
3. Select **PHP (php.ini)**

OR navigate to: `C:\xampp\php\php.ini`

### Step 2: Find and Update These Lines

Press `Ctrl+F` to search for each setting:

**Search for:** `upload_max_filesize`
```ini
; Change this:
upload_max_filesize = 2M

; To this:
upload_max_filesize = 512M
```

**Search for:** `post_max_size`
```ini
; Change this:
post_max_size = 8M

; To this:
post_max_size = 520M
```

**Search for:** `max_execution_time`
```ini
; Change this:
max_execution_time = 30

; To this:
max_execution_time = 600
```

**Search for:** `max_input_time`
```ini
; Change this:
max_input_time = 60

; To this:
max_input_time = 600
```

**Search for:** `memory_limit`
```ini
; Change this:
memory_limit = 128M

; To this:
memory_limit = 512M
```

### Step 3: Save and Restart
1. **Save** the php.ini file (Ctrl+S)
2. **Close** the text editor
3. In XAMPP Control Panel:
   - Click **Stop** on Apache
   - Wait 3-5 seconds
   - Click **Start** on Apache

### Step 4: Verify
Visit: `http://localhost/lms-app/backend-laravel/public/check-upload-limits.php`

---

## Still Not Working? Additional Checks:

### Check 1: Clear Browser Cache
1. Press `Ctrl+Shift+Delete`
2. Clear cached images and files
3. Refresh the page

### Check 2: Check Laravel Cache
Run in PowerShell from project folder:
```powershell
cd backend-laravel
php artisan config:clear
php artisan cache:clear
```

### Check 3: Check Apache Error Log
Location: `C:\xampp\apache\logs\error.log`
Look for recent errors related to file uploads

### Check 4: Check Laravel Log
Location: `backend-laravel\storage\logs\laravel.log`
Look for validation errors

### Check 5: Try Without File First
1. Create an assignment **without** uploading a file
2. If that works, the issue is definitely upload limits
3. Then try uploading a very small file (< 1MB)
4. Gradually increase file size to test

---

## Test File Sizes:
- Small test: 1-5 MB
- Medium test: 10-50 MB  
- Large test: 100-200 MB
- Maximum: 500 MB

---

## Common Issues:

### Issue: "Run with PowerShell" option not appearing
**Solution:** Open PowerShell as Administrator manually:
```powershell
cd C:\xampp\htdocs\lms-app
.\update-php-limits.ps1
```

### Issue: Script execution disabled
**Solution:** Run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Changes not taking effect
**Solution:**
1. Make sure you edited the correct php.ini file
2. Check if there's a php.ini in `C:\xampp\apache\bin\php.ini` (edit that too)
3. Completely stop and start XAMPP (not just Apache)
4. Restart your computer

---

## After Fix is Complete:

### Delete Check File (Security)
After confirming the limits work, delete:
`backend-laravel/public/check-upload-limits.php`

### Test Assignment Upload
1. Go to Faculty Dashboard
2. Open a course
3. Click Assignments tab
4. Click "Add Assignment"
5. Fill in details
6. Upload a file
7. Click "Create Assignment"

Should work without errors! ✅

---

## Need More Help?

If you still get the error after following all steps:
1. Take a screenshot of the check-upload-limits.php output
2. Check the browser console for the exact error
3. Check backend-laravel/storage/logs/laravel.log for details
4. The error message will tell you exactly which validation failed
