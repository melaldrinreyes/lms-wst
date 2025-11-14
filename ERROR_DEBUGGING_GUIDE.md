# Error Handling & Debugging Guide

## Common Issues & Solutions

### Error: "Request failed with status code 400"

**What it means**: The backend rejected the request data

**How to debug**:

1. **Check Browser Console** (F12 → Console tab)
   ```
   Look for: "Sending lectures to backend:"
   This will show the exact data being sent
   ```

2. **Check Network Tab** (F12 → Network tab)
   - Click "Save" button
   - Find request to `/api/courses/*/lectures`
   - Click on it
   - Look at "Response" tab for error details

3. **Check Backend Logs**
   ```bash
   cd /opt/lampp/htdocs/lms-wst/backend-laravel
   tail -50 storage/logs/laravel.log
   ```

### Improved Error Messages (After Recent Update)

The frontend now logs:
```javascript
console.log('Sending lectures to backend:', updatedLectures);
console.error('Response data:', error.response?.data);
```

And shows detailed error in toast:
```
Error: {message from backend} {validation errors if any}
```

### Backend Validation Checks

The backend now validates:
1. ✓ Lectures array exists
2. ✓ Array is not empty
3. ✓ Each lecture has a title
4. ✓ Type casting ensures proper data types:
   - `course_id` → integer
   - `parent_lecture_id` → integer or null
   - `title` → string
   - `content` → string
   - `order` → integer
   - `level` → integer
   - `created_by` → user ID

### If You Get 400 Error Still:

**Step 1: Check what you're sending**
```
Open DevTools → Console
You should see: "Sending lectures to backend:"
Copy the object logged
```

**Step 2: Verify data structure**
Each lecture should have:
```javascript
{
  id: 1,                           // DB ID or Date.now()
  course_id: 1,                    // Course ID
  parent_lecture_id: null,         // null for root, ID for sub
  title: "Module 1",               // String, required
  content: "<p>...</p>",           // String, can be empty
  order: 0,                        // Number
  level: 0,                        // Number (0 for root)
  created_at: "...",              // ISO string
  created_by: 2                    // User ID
}
```

**Step 3: Check authorization**
Verify you're logged in as teacher (role_id = 2)
```bash
# In browser console
const token = localStorage.getItem('token');
console.log('Token:', token);
```

**Step 4: Check course ownership**
Teacher can only edit their own courses
```bash
# Check backend logs
tail storage/logs/laravel.log | grep -i "cannot edit"
```

## Frontend Console Debugging

Enable more detailed logging:

```javascript
// Add to HierarchicalLectureContent.jsx saveLecture function
console.log('Editing lecture ID:', editingLectureId);
console.log('Current content length:', currentContent.length);
console.log('Total lectures:', lectures.length);
console.log('Updated lectures:', updatedLectures);
```

## Backend Debugging

**Enable query logging**:
```php
// In CourseLectureController.php
\Illuminate\Support\Facades\DB::enableQueryLog();
// ... save code ...
dd(\Illuminate\Support\Facades\DB::getQueryLog());
```

**Or check raw errors**:
```bash
php artisan tinker
>>> \Log::error('Test error', ['context' => 'data']);
>>> exit
tail storage/logs/laravel.log
```

## Testing the Save Endpoint Directly

**Using cURL**:
```bash
curl -X POST http://localhost:8000/api/courses/1/lectures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lectures": [
      {
        "id": '$(date +%s)',
        "course_id": 1,
        "parent_lecture_id": null,
        "title": "Test Module",
        "content": "",
        "order": 0,
        "level": 0
      }
    ]
  }'
```

**Using Postman**:
1. Method: POST
2. URL: `http://localhost:8000/api/courses/1/lectures`
3. Headers:
   - `Authorization: Bearer {token}`
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "lectures": [
       {
         "id": 1731574800123,
         "course_id": 1,
         "parent_lecture_id": null,
         "title": "Test",
         "content": "",
         "order": 0,
         "level": 0
       }
     ]
   }
   ```

## Recent Improvements

✅ Better error messages in frontend toast
✅ Console logging of sent data
✅ Strict type casting in backend
✅ Better validation error handling
✅ Empty array validation
✅ Detailed exception messages

## Expected Responses

### Success (200)
```json
{
  "success": true,
  "message": "Lectures saved successfully",
  "lectures": [
    {
      "id": 42,
      "course_id": 1,
      "parent_lecture_id": null,
      "title": "Module 1",
      "content": "",
      "level": 0,
      "order": 1,
      "created_by": 2,
      "created_at": "2025-11-14T...",
      "updated_at": "2025-11-14T..."
    }
  ]
}
```

### Error (400)
```json
{
  "success": false,
  "message": "Failed to create lecture: {specific error}",
  "errors": {...} // If validation errors
}
```

### Unauthorized (403)
```json
{
  "success": false,
  "message": "Unauthorized" // or "You cannot edit this course"
}
```

## Real-Time Debugging

**Watch API calls in real-time**:
```bash
cd /opt/lampp/htdocs/lms-wst/backend-laravel

# Terminal 1: Monitor logs
tail -f storage/logs/laravel.log | grep -i "lecture\|error\|post"

# Terminal 2: Monitor database
watch -n 1 'mysql -u root minsu_lms -e "SELECT id, title, parent_lecture_id, level FROM course_lectures ORDER BY id DESC LIMIT 5;"'
```

## Verify Everything is Working

**Test suite** (in order):
```bash
# 1. Check API responds
curl http://localhost:8000/api/test

# 2. Check auth works
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/test-auth

# 3. Check can fetch lectures
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/courses/1/lectures

# 4. Try saving with cURL (see above)

# 5. Check database directly
mysql -u root minsu_lms -e "SELECT * FROM course_lectures LIMIT 5;"
```

## Still Having Issues?

1. **Check PHP version**: `php -v`
   - Should be 8.1+
   
2. **Check Laravel version**: `php artisan --version`
   - Should be 12.35.1+

3. **Clear caches**:
   ```bash
   php artisan cache:clear
   php artisan config:cache
   php artisan view:clear
   ```

4. **Check database connection**:
   ```bash
   php artisan tinker
   >>> DB::connection()->getDatabaseName()
   >>> exit
   ```

5. **Check migrations**:
   ```bash
   php artisan migrate:status
   ```

## Contact Information

If errors persist:
1. Save console error logs
2. Save network response data
3. Save backend logs
4. Check table structure: `describe course_lectures;`
5. Share: screenshot + error messages + database state
