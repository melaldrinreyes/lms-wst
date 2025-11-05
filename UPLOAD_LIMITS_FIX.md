# File Upload Limits Fix Guide

## Problem
Large files (especially videos) fail to upload with errors.

## Root Causes
1. **PHP Configuration Limits** - Default XAMPP settings are too low
2. **Web Server Limits** - Apache has default limits
3. **Browser Timeouts** - Long uploads may timeout

## Solutions Applied

### 1. Backend Configuration (Already Done)

#### `.htaccess` File (backend-laravel/public/.htaccess)
```apache
php_value upload_max_filesize 512M
php_value post_max_size 520M
php_value max_execution_time 600
php_value max_input_time 600
php_value memory_limit 512M
```

#### Laravel Validation
- ModuleController: Allows up to 500MB files
- SubmissionController: Allows up to 500MB files
- Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, images, videos (MP4, MOV, AVI, MKV, WEBM, FLV, WMV), archives (ZIP, RAR, 7Z)

### 2. XAMPP php.ini Configuration (REQUIRED)

You need to update your XAMPP php.ini file:

1. **Find php.ini file:**
   - Location: `C:\xampp\php\php.ini`

2. **Edit these settings:**
   ```ini
   upload_max_filesize = 512M
   post_max_size = 520M
   max_execution_time = 600
   max_input_time = 600
   memory_limit = 512M
   max_file_uploads = 20
   ```

3. **Restart Apache:**
   - Open XAMPP Control Panel
   - Stop Apache
   - Start Apache again

### 3. Check Current Settings

Visit this URL to check your PHP configuration:
```
http://localhost:8000/api/php-config
```

This will show your current PHP upload limits.

## Supported File Types

### Documents
- PDF
- DOC, DOCX
- PPT, PPTX
- TXT

### Images
- JPG, JPEG
- PNG
- GIF

### Videos
- MP4
- MOV
- AVI
- MKV
- WEBM
- FLV
- WMV

### Archives
- ZIP
- RAR
- 7Z

## Maximum File Size
- **500 MB** per file

## Troubleshooting

### Error: "File exceeds upload_max_filesize"
**Solution:** Update php.ini as described above and restart Apache.

### Error: "Maximum execution time exceeded"
**Solution:** Increase `max_execution_time` in php.ini to 600 or higher.

### Error: "Failed to write file to disk"
**Solution:** 
1. Check storage folder permissions
2. Run: `php artisan storage:link`
3. Ensure `storage/app/public` folder exists

### Error: "File is too large"
**Solution:** The file exceeds 500MB. Consider:
1. Compressing the video
2. Splitting into smaller parts
3. Using external video hosting (YouTube, Vimeo)

## Video Upload Best Practices

1. **Compress videos before upload:**
   - Use HandBrake or similar tools
   - Target: 720p or 1080p resolution
   - H.264 codec recommended
   - Keep bitrate reasonable (2-5 Mbps)

2. **Recommended formats:**
   - MP4 (best compatibility)
   - WEBM (good compression)

3. **For very large videos:**
   - Consider using YouTube/Vimeo and embedding links
   - Or split into multiple parts

## How to Test

1. **Check PHP Config:**
   ```
   Visit: http://localhost:8000/api/php-config
   ```

2. **Test Small File:**
   - Upload a small PDF (< 5MB)
   - Should work immediately

3. **Test Large File:**
   - Upload a 50-100MB file
   - Monitor Laravel logs: `storage/logs/laravel.log`

4. **Test Video:**
   - Upload a short MP4 video
   - Check if it processes successfully

## Monitoring Uploads

Check Laravel logs for detailed upload information:
- Location: `backend-laravel/storage/logs/laravel.log`
- Look for: "Processing file upload", "File stored successfully"

## Emergency Fallback

If uploads still fail after php.ini changes:

1. **Increase .htaccess limits even more:**
   ```apache
   php_value upload_max_filesize 1024M
   php_value post_max_size 1050M
   ```

2. **Check Apache error logs:**
   - `C:\xampp\apache\logs\error.log`

3. **Check disk space:**
   - Ensure enough free space in `storage/app/public`
