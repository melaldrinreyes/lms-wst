# Announcements API Documentation

## Overview
Complete backend implementation for announcements system with comments functionality.

---

## Features Implemented

### Faculty/Admin Features:
✅ Create announcements for their courses
✅ Edit/update their announcements
✅ Delete their announcements
✅ Set announcement priority (low, normal, high)
✅ Set announcement status (draft, published)
✅ View all their announcements

### Student Features:
✅ View all published announcements from enrolled courses
✅ View announcement details with comments
✅ Add comments to announcements
✅ Edit their own comments
✅ Delete their own comments

---

## Database Structure

### Announcements Table
```
- id (bigint)
- course_id (foreign key to courses)
- title (string, max 200)
- content (text)
- created_by (foreign key to users)
- priority (enum: low, normal, high)
- status (enum: published, draft)
- created_at (timestamp)
- updated_at (timestamp)
```

### Announcement Comments Table
```
- id (bigint)
- announcement_id (foreign key to announcements)
- user_id (foreign key to users)
- comment (text)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## API Endpoints

### 1. Get All Announcements
**Endpoint:** `GET /api/announcements`  
**Auth:** Required  
**Query Parameters:**
- `course_id` (optional) - Filter by specific course

**Logic:**
- Students: Only see published announcements from enrolled courses
- Faculty: See their own announcements (all statuses)
- Admin: See all announcements

**Response:**
```json
{
  "success": true,
  "announcements": [
    {
      "id": 1,
      "course_id": 4,
      "title": "Midterm Exam Schedule",
      "content": "The midterm exam will be held on...",
      "created_by": 2,
      "priority": "high",
      "status": "published",
      "created_at": "2025-11-05T10:30:00.000000Z",
      "updated_at": "2025-11-05T10:30:00.000000Z",
      "comments_count": 5,
      "creator": {
        "id": 2,
        "name": "Dr. John Smith",
        "email": "john.smith@minsu.edu.ph"
      },
      "course": {
        "id": 4,
        "name": "Introduction to Programming"
      }
    }
  ]
}
```

---

### 2. Get Student Announcements
**Endpoint:** `GET /api/student/announcements`  
**Auth:** Required (Students only)  
**Role:** Student (role_id = 3)

**Logic:**
- Returns only published announcements from courses the student is enrolled in
- Sorted by priority (high first) then by date (newest first)

**Response:** Same as Get All Announcements

---

### 3. Get Faculty Announcements
**Endpoint:** `GET /api/faculty/announcements`  
**Auth:** Required (Faculty only)  
**Role:** Faculty (role_id = 2)

**Logic:**
- Returns all announcements created by the logged-in faculty member
- Includes both published and draft announcements
- Includes statistics and comment counts

**Response:**
```json
{
  "success": true,
  "announcements": [
    {
      "id": 1,
      "course_id": 4,
      "title": "Midterm Exam Schedule",
      "content": "The midterm exam will be held on...",
      "created_by": 2,
      "priority": "high",
      "status": "published",
      "created_at": "2025-11-05T10:30:00.000000Z",
      "updated_at": "2025-11-05T10:30:00.000000Z",
      "comments_count": 5,
      "course": {
        "id": 4,
        "course_name": "Database Systems",
        "course_code": "CS301"
      },
      "comments": [
        {
          "id": 1,
          "announcement_id": 1,
          "user_id": 10,
          "comment": "Thank you!",
          "created_at": "2025-11-05T11:00:00.000000Z",
          "user": {
            "id": 10,
            "name": "Student Name",
            "email": "student@minsu.edu.ph",
            "profile_image": "https://..."
          }
        }
      ]
    }
  ],
  "stats": {
    "total": 15,
    "published": 12,
    "draft": 3,
    "high_priority": 5,
    "total_comments": 45
  }
}
```

---

### 4. Get Announcements by Course (Faculty)
**Endpoint:** `GET /api/faculty/courses/{courseId}/announcements`  
**Auth:** Required (Faculty only)  
**Role:** Faculty (role_id = 2)

**Parameters:**
- `courseId` - The ID of the course

**Security:**
- Faculty can only view announcements for their own courses
- Returns 403 if trying to access another faculty's course

**Response:**
```json
{
  "success": true,
  "announcements": [
    {
      "id": 1,
      "course_id": 4,
      "title": "Midterm Exam Schedule",
      "content": "...",
      "priority": "high",
      "status": "published",
      "comments_count": 5,
      "creator": {
        "id": 2,
        "name": "Dr. John Smith",
        "email": "john.smith@minsu.edu.ph",
        "profile_image": "https://..."
      },
      "course": {
        "id": 4,
        "course_name": "Database Systems"
      }
    }
  ]
}
```

---

### 5. Get Single Announcement  
**Role:** Student (role_id = 3)

**Logic:**
- Returns only published announcements from courses the student is enrolled in
- Sorted by priority (high first) then by date (newest first)

**Response:** Same as Get All Announcements

---

### 3. Get Single Announcement
**Endpoint:** `GET /api/announcements/{id}`  
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "announcement": {
    "id": 1,
    "course_id": 4,
    "title": "Midterm Exam Schedule",
    "content": "The midterm exam will be held on...",
    "created_by": 2,
    "priority": "high",
    "status": "published",
    "created_at": "2025-11-05T10:30:00.000000Z",
    "updated_at": "2025-11-05T10:30:00.000000Z",
    "creator": {
      "id": 2,
      "name": "Dr. John Smith",
      "email": "john.smith@minsu.edu.ph",
      "profile_image": "https://..."
    },
    "course": {
      "id": 4,
      "name": "Introduction to Programming"
    },
    "comments": [
      {
        "id": 1,
        "announcement_id": 1,
        "user_id": 5,
        "comment": "Thank you for the update!",
        "created_at": "2025-11-05T11:00:00.000000Z",
        "updated_at": "2025-11-05T11:00:00.000000Z",
        "user": {
          "id": 5,
          "name": "Juan Dela Cruz",
          "email": "juan@minsu.edu.ph",
          "profile_image": "https://..."
        }
      }
    ]
  }
}
```

---

### 4. Create Announcement
**Endpoint:** `POST /api/announcements`  
**Auth:** Required (Faculty/Admin only)  
**Role:** Faculty (role_id = 2) or Admin (role_id = 1)

**Request Body:**
```json
{
  "course_id": 4,
  "title": "Midterm Exam Schedule",
  "content": "The midterm exam will be held on November 15, 2025 at 9:00 AM...",
  "priority": "high",
  "status": "published"
}
```

**Validation:**
- `course_id` - required, must exist in courses table
- `title` - required, max 200 characters
- `content` - required
- `priority` - required, must be: low, normal, or high
- `status` - required, must be: published or draft

**Security:**
- Faculty can only create announcements for their own courses
- Admin can create for any course

**Response:**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "announcement": { ... }
}
```

---

### 5. Update Announcement
**Endpoint:** `PUT /api/announcements/{id}`  
**Auth:** Required (Faculty/Admin only)  
**Role:** Faculty (role_id = 2) or Admin (role_id = 1)

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "priority": "normal",
  "status": "published"
}
```

**Validation:**
- All fields are optional
- Same validation rules as create

**Security:**
- Faculty can only update their own announcements
- Admin can update any announcement

**Response:**
```json
{
  "success": true,
  "message": "Announcement updated successfully",
  "announcement": { ... }
}
```

---

### 6. Delete Announcement
**Endpoint:** `DELETE /api/announcements/{id}`  
**Auth:** Required (Faculty/Admin only)  
**Role:** Faculty (role_id = 2) or Admin (role_id = 1)

**Security:**
- Faculty can only delete their own announcements
- Admin can delete any announcement
- Deleting announcement also deletes all comments (cascade)

**Response:**
```json
{
  "success": true,
  "message": "Announcement deleted successfully"
}
```

---

### 7. Get Announcement Comments
**Endpoint:** `GET /api/announcements/{announcementId}/comments`  
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "id": 1,
      "announcement_id": 1,
      "user_id": 5,
      "comment": "Great announcement!",
      "created_at": "2025-11-05T11:00:00.000000Z",
      "updated_at": "2025-11-05T11:00:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Dela Cruz",
        "email": "juan@minsu.edu.ph",
        "profile_image": "https://..."
      }
    }
  ]
}
```

---

### 8. Add Comment
**Endpoint:** `POST /api/announcement-comments`  
**Auth:** Required (All users)

**Request Body:**
```json
{
  "announcement_id": 1,
  "comment": "This is my comment on the announcement"
}
```

**Validation:**
- `announcement_id` - required, must exist
- `comment` - required

**Security:**
- Students can only comment on published announcements
- Faculty/Admin can comment on any announcement

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "id": 1,
    "announcement_id": 1,
    "user_id": 5,
    "comment": "This is my comment on the announcement",
    "created_at": "2025-11-05T11:00:00.000000Z",
    "updated_at": "2025-11-05T11:00:00.000000Z",
    "user": {
      "id": 5,
      "name": "Juan Dela Cruz",
      "email": "juan@minsu.edu.ph",
      "profile_image": "https://..."
    }
  }
}
```

---

### 9. Update Comment
**Endpoint:** `PUT /api/announcement-comments/{id}`  
**Auth:** Required

**Request Body:**
```json
{
  "comment": "Updated comment text"
}
```

**Validation:**
- `comment` - required

**Security:**
- Users can only update their own comments

**Response:**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "comment": { ... }
}
```

---

### 10. Delete Comment
**Endpoint:** `DELETE /api/announcement-comments/{id}`  
**Auth:** Required

**Security:**
- Users can only delete their own comments

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Priority System

Announcements are sorted by priority:
- **high** - Urgent announcements (exams, deadlines)
- **normal** - Regular announcements
- **low** - Optional information

---

## Status System

- **published** - Visible to all students
- **draft** - Only visible to creator (faculty)

---

## Security Features

✅ **Role-based access control**
- Faculty can only manage their own course announcements
- Students can only view published announcements
- Admin has full access

✅ **Comment ownership**
- Users can only edit/delete their own comments

✅ **Enrollment verification**
- Students only see announcements from enrolled courses

✅ **Status protection**
- Students cannot access draft announcements

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated. Please login to continue."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You can only create announcements for your own courses"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Announcement not found"
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "title": ["The title field is required."],
    "content": ["The content field is required."]
  }
}
```

---

## Usage Examples

### Faculty Creating an Announcement
```javascript
const response = await api.post('/announcements', {
  course_id: 4,
  title: 'Assignment Due Date Extended',
  content: 'The deadline for Assignment 3 has been extended to November 20.',
  priority: 'high',
  status: 'published'
});
```

### Student Viewing Announcements
```javascript
const response = await api.get('/student/announcements');
// Returns all published announcements from enrolled courses
```

### Student Adding a Comment
```javascript
const response = await api.post('/announcement-comments', {
  announcement_id: 1,
  comment: 'Thank you for the extension!'
});
```

### Student Editing Their Comment
```javascript
const response = await api.put('/announcement-comments/5', {
  comment: 'Thank you very much for the extension!'
});
```

---

## Implementation Checklist

✅ Database migrations created
✅ Announcement model created
✅ AnnouncementComment model created
✅ AnnouncementController created
✅ AnnouncementCommentController created
✅ API routes configured
✅ Role-based permissions implemented
✅ Validation rules added
✅ Security checks implemented
✅ Relationships configured

---

## Next Steps for Frontend

1. Create announcement list component
2. Create announcement detail/view component
3. Create announcement form (faculty)
4. Create comment section component
5. Add comment form
6. Add edit/delete comment functionality
7. Implement priority badges (color-coded)
8. Add real-time updates (optional)
