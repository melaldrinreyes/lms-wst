# Lecture Organization System - Documentation

## Overview

The LMS now supports organizing course content into multiple **lecture sections/sub-pages**. Instead of one single content block, teachers can create multiple organized lectures for each course, and students can view them individually.

## Database Schema

### `course_lectures` Table
```sql
CREATE TABLE course_lectures (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT NOT NULL (FK to courses),
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  order INT DEFAULT 0,
  created_by BIGINT NOT NULL (FK to users),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  INDEX (course_id),
  INDEX (course_id, order)
);
```

**Fields:**
- `id` - Unique lecture identifier
- `course_id` - Foreign key to the course this lecture belongs to
- `title` - Lecture title (e.g., "Lecture 1: Introduction")
- `content` - Full HTML/rich text content of the lecture (LONGTEXT)
- `order` - Display order for sorting lectures
- `created_by` - Teacher/admin who created this lecture

## Backend API Endpoints

### Get All Lectures (Teacher View)
```
GET /api/courses/{courseId}/lectures
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "lectures": [
    {
      "id": 1,
      "title": "Lecture 1: Introduction",
      "content": "<h1>Introduction</h1><p>...",
      "order": 1,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Lectures (Student/Public View)
```
GET /api/courses/{courseId}/lectures/view
```
**Response:** Same format as above, but only includes id, title, content, and order

### Save/Update Lectures (Batch Operation)
```
POST /api/courses/{courseId}/lectures
Authorization: Bearer {token}
Content-Type: application/json

{
  "lectures": [
    {
      "id": 1,
      "title": "Lecture 1: Introduction",
      "content": "<h1>Introduction</h1><p>...",
      "order": 1
    },
    {
      "id": 2,
      "title": "Lecture 2: Security Devices",
      "content": "<h1>Security</h1><p>...",
      "order": 2
    }
  ]
}
```

### Delete a Lecture
```
DELETE /api/courses/{courseId}/lectures/{lectureId}
Authorization: Bearer {token}
```

## Frontend Components

### `LectureContent.jsx`
Location: `/frontend-react/src/components/LectureContent.jsx`

**Features:**
- **For Teachers:**
  - Add new lectures with title input
  - Edit lecture content with TipTap WYSIWYG editor
  - Delete lectures with confirmation
  - Split-view editor with live preview
  - Show/hide preview toggle

- **For Students:**
  - View list of all lectures
  - Expand/collapse lectures to view content
  - See content ready status (✓ Content ready)
  - Professional styling with gradients

**Props:**
- `courseId` - ID of the course
- `isTeacher` - Boolean (true for teachers, false for students)
- `onSave` - Callback function when content is saved

**Key States:**
- `lectures` - Array of all lectures
- `isEditing` - Whether in edit mode
- `editingLectureId` - Index of lecture being edited
- `expandedLectures` - Object tracking which lectures are expanded
- `showPreview` - Toggle for showing live preview
- `newLectureTitle` - Input for creating new lecture

## Frontend Integration

### CourseManage (Teacher Interface)
Location: `/frontend-react/src/pages/faculty/CourseManage.jsx`

- Content tab (default active)
- Uses `<LectureContent courseId={id} isTeacher={true} />`
- Teachers see "Add Lecture" button and can edit/delete

### CourseDetail (Student Interface)
Location: `/frontend-react/src/pages/student/CourseDetail.jsx`

- Content tab shows lectures
- Uses `<LectureContent courseId={id} isTeacher={false} />`
- Students see organized lecture list
- Can expand each lecture to view content

## User Workflows

### Teacher Adding a Lecture
1. Go to Course → Content tab
2. Enter lecture title in "Add New Lecture" input
3. Click "Add Lecture" button
4. New lecture appears in list (initially empty)
5. Click "Edit" button on the lecture
6. Use TipTap editor to add content
7. See live preview on the right side
8. Click "Save Lecture" to persist

### Teacher Editing/Deleting
1. Click "Edit" to edit lecture content
2. Click "Delete" to remove lecture with confirmation
3. Teachers can reorder by editing and saving lectures in desired order

### Student Viewing Lectures
1. Go to Course → Content tab
2. See list of organized lectures
3. Click chevron or lecture title to expand
4. View formatted content with:
   - Proper headings (h1, h2, h3)
   - Bulleted/numbered lists
   - Code blocks
   - Tables
   - Images
   - YouTube videos
   - Blockquotes
5. Collapse to save screen space

## Technical Implementation

### Database
- **Migration:** `/backend-laravel/database/migrations/2024_01_01_000000_create_course_lectures_table.php`
- **Model:** `/backend-laravel/app/Models/CourseLecture.php`
- Indexes on `course_id` and `(course_id, order)` for optimal query performance

### Backend Controller
- **Controller:** `/backend-laravel/app/Http/Controllers/CourseLectureController.php`
- Handles CRUD operations with proper authorization
- Teachers can only manage their own course lectures
- Batch save/update operation for efficiency

### Routes
```php
// API routes in /routes/api.php
Route::get('/courses/{courseId}/lectures/view', [CourseLectureController::class, 'view']);
Route::get('/courses/{courseId}/lectures', [CourseLectureController::class, 'index']);
Route::post('/courses/{courseId}/lectures', [CourseLectureController::class, 'store']);
Route::delete('/courses/{courseId}/lectures/{lectureId}', [CourseLectureController::class, 'destroy']);
```

## Authorization

- **Teachers:** Can create, edit, delete lectures in their own courses
- **Admin:** Can manage lectures in any course
- **Students:** Can only view lectures in enrolled courses
- **Public:** No access (requires authentication)

## Content Styling for Students

Student lecture content is styled with:
- **Headings:** Orange gradient colors (h1: #f97316, h2: #fb923c, h3: #fdba74)
- **Text:** Light gray with proper line-height (1.8)
- **Lists:** Proper bullet/number formatting with indentation
- **Blockquotes:** Orange left border with italic text
- **Images:** Max-width 100%, rounded corners, border
- **Tables:** Orange header, responsive layout
- **Code:** Syntax highlighting (via TipTap)
- **Links:** Interactive styling
- **Videos:** Responsive iframe with aspect ratio

## Migration Path from CourseContent

Old system stored single content per course:
```
course_content table:
- id
- course_id
- content (LONGTEXT) -- ALL content in one field
- created_by
```

New system supports multiple lectures:
```
course_lectures table:
- id
- course_id
- title
- content (LONGTEXT) -- Individual lecture content
- order
- created_by
```

**Migration Strategy:**
If needed to migrate old content to new system:
1. Can create a single "General" lecture for each course
2. Populate with existing `course_content` data
3. Preserve timestamps and creators

## Future Enhancements

Potential features to add:
- Drag-to-reorder lectures
- Lecture attachments/resources
- Lecture completion tracking for students
- Lecture statistics (views, time spent)
- Discussion/comments per lecture
- Video uploads per lecture
- Lecture schedule/release dates
- Bookmark/favorite lectures

## File Structure

```
backend-laravel/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── CourseLectureController.php (NEW)
│   └── Models/
│       └── CourseLecture.php (NEW)
├── database/
│   └── migrations/
│       └── 2024_01_01_000000_create_course_lectures_table.php (NEW)
└── routes/
    └── api.php (UPDATED - added lecture routes)

frontend-react/
├── src/
│   ├── components/
│   │   └── LectureContent.jsx (NEW)
│   └── pages/
│       ├── faculty/
│       │   └── CourseManage.jsx (UPDATED - uses LectureContent)
│       └── student/
│           └── CourseDetail.jsx (UPDATED - uses LectureContent)
```

## Testing

### Teacher Flow
1. ✅ Add lecture with title
2. ✅ Edit lecture content with WYSIWYG editor
3. ✅ Preview content before saving
4. ✅ Save lecture
5. ✅ Edit existing lecture
6. ✅ Delete lecture with confirmation

### Student Flow
1. ✅ View list of lectures for course
2. ✅ Expand lecture to view content
3. ✅ Content displays with proper styling
4. ✅ Collapse lectures
5. ✅ View multiple lectures

## Notes

- **Performance:** Indexed queries on course_id ensure fast retrieval
- **Scalability:** Batch save operation minimizes database calls
- **UX:** Split-view editor helps teachers see student experience
- **Mobile:** Responsive design works on all screen sizes
- **Accessibility:** Proper heading hierarchy and semantic HTML
