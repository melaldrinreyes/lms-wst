# File Upload Limits Configuration

## Current Configuration
- **Upload Max Filesize**: 512MB (500MB)
- **Post Max Size**: 520MB
- **Max Execution Time**: 600 seconds (10 minutes)
- **Memory Limit**: 512MB

## Files Updated

### Backend
1. **ModuleController.php** - Max file size: 512000 KB (500MB)
2. **AssignmentController.php** - Max file size: 512000 KB (500MB)
3. **public/.htaccess** - PHP directives for upload limits
4. **public/.user.ini** - Alternative PHP configuration

### Frontend
1. **CourseManage.jsx** - Updated error messages and UI hints to 500MB

## Manual PHP Configuration (If .htaccess doesn't work)

### Option 1: Edit XAMPP php.ini
Location: `C:\xampp\php\php.ini`

Find and update these lines:
```ini
upload_max_filesize = 512M
post_max_size = 520M
max_execution_time = 600
max_input_time = 600
memory_limit = 512M
```

**After editing, restart Apache in XAMPP Control Panel.**

### Option 2: Verify Current PHP Limits
Create a file `phpinfo.php` in `backend-laravel/public/` with:
```php
<?php
phpinfo();
?>
```

Visit: `http://localhost/lms-app/backend-laravel/public/phpinfo.php`

Look for:
- `upload_max_filesize`
- `post_max_size`
- `max_execution_time`
- `memory_limit`

**Delete this file after checking for security.**

## Supported File Types

### Modules & Assignments:
- **Documents**: PDF, DOC, DOCX, PPT, PPTX, TXT, XLS, XLSX
- **Images**: JPG, JPEG, PNG, GIF
- **Videos**: MP4, MOV, AVI, MKV
- **Archives**: ZIP, RAR

## Troubleshooting

### If uploads still fail:

1. **Check Apache Error Log**:
   - Location: `C:\xampp\apache\logs\error.log`

2. **Check Laravel Log**:
   - Location: `backend-laravel/storage/logs/laravel.log`

3. **Increase limits even more** (for very large files):
   ```ini
   upload_max_filesize = 1024M  ; 1GB
   post_max_size = 1050M
   max_execution_time = 900     ; 15 minutes
   memory_limit = 1024M
   ```

4. **Verify .htaccess is being read**:
   - Make sure `AllowOverride All` is set in Apache config
   - Location: `C:\xampp\apache\conf\httpd.conf`

5. **Alternative: Use environment variable**:
   In `backend-laravel/.env`:
   ```
   UPLOAD_MAX_FILESIZE=512M
   POST_MAX_SIZE=520M
   ```

## Testing Upload Limits

1. Try uploading a small file (< 10MB) first
2. Gradually increase file size to test limits
3. Check console and network tab for errors
4. Monitor backend logs for validation failures

## Production Deployment Notes

For production servers (not XAMPP):
- Update server's `php.ini` configuration
- Restart PHP-FPM or Apache
- Check Nginx configuration if applicable
- Consider using chunked uploads for very large files
- Implement progress bars for better UX

## Current Status
✅ Laravel validation: 500MB
✅ .htaccess PHP limits: 512MB upload, 520MB post
✅ .user.ini PHP limits: 512MB upload, 520MB post
✅ Frontend UI updated with new limits
✅ Error messages updated

**Note**: Remember to restart Apache after changing PHP configuration!
