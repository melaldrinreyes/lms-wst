# Complete Lecture Hierarchy & Content Persistence Guide

## Overview
The system now supports:
- ✅ Hierarchical lectures (modules with sub-lectures)
- ✅ Explicit "Save" button (no autosave)
- ✅ Content persists to database
- ✅ Students can view saved content
- ✅ Proper route configuration
- ✅ Database structure with parent-child relationships

## Architecture

### Database Structure
```
course_lectures table:
├── id (bigint, PK)
├── course_id (bigint, FK)
├── parent_lecture_id (bigint, FK to self - nullable)
├── title (varchar)
├── content (longtext)
├── level (int) - 0=root, 1=sub-lecture, etc.
├── order (int)
├── created_by (bigint, FK)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Model Relationships
```php
// Parent relationship
public function parent() {
    return $this->belongsTo(CourseLecture::class, 'parent_lecture_id');
}

// Children relationship
public function children() {
    return $this->hasMany(CourseLecture::class, 'parent_lecture_id');
}

// All descendants
public function descendants() {
    return $this->children()->with('descendants');
}
```

## Routes Configuration

### GET Routes (Anyone can view)
```
GET /api/courses/{courseId}/lectures
   ↓ Returns all lectures with hierarchical structure
   ↓ CourseLectureController@index

GET /api/courses/{courseId}/lectures/view
   ↓ Student view of lectures (optional filtered view)
   ↓ CourseLectureController@view
```

### POST Routes (Teachers & Admins only)
```
POST /api/courses/{courseId}/lectures
   ↓ Batch save/update/create lectures
   ↓ CourseLectureController@store
   ↓ Payload: { lectures: [...] }
```

### DELETE Routes (Teachers & Admins only)
```
DELETE /api/courses/{courseId}/lectures/{lectureId}
   ↓ Delete lecture and cascade children
   ↓ CourseLectureController@destroy
```

## Frontend Workflow

### Teacher (Faculty) Actions

#### 1. Create Module (Root Lecture)
```
User enters: "Module 1: Introduction"
Click: "Add" button
→ Creates temp lecture with id: Date.now()
→ Appears in list immediately
→ No auto-save
```

#### 2. Add Sub-Lectures
```
Click: Green "+" button on module
→ Modal appears
User enters: "Chapter 1: Getting Started"
Click: "Create"
→ Sub-lecture added with parent_lecture_id = module.id
→ Parent auto-expands
→ Green banner shows: "✓ 1 unsaved sub-lecture"
→ Repeat for more sub-lectures
```

#### 3. Save All Sub-Lectures
```
When unsaved sub-lectures exist:
Click: Green "Save All" button
→ POST /api/courses/{courseId}/lectures
→ Backend creates all new lectures in DB
→ Returns updated lectures with real IDs
→ Frontend updates state
→ Green banner disappears
```

#### 4. Edit Sub-Lecture Content
```
Click: "Edit" button on sub-lecture
→ Opens editor modal
→ User enters rich-text content
→ Split-view shows live preview
Click: "Save"
→ Sends updated content to backend
→ Content persisted in database
→ Editor closes
→ Toast: "Lecture saved successfully!"
```

#### 5. Delete Sub-Lecture
```
Click: Red trash icon on sub-lecture
→ Confirmation modal appears
Click: "Delete"
→ Sub-lecture removed from list
→ Database updated
→ Children cascade deleted if any
```

### Student (Learner) Actions

#### 1. View Course Materials
```
Navigate to: Course → "Course Materials" tab
→ Loads all lectures via GET /api/courses/{courseId}/lectures
→ Displays hierarchical structure
```

#### 2. Expand Module
```
Click: Module title or arrow icon
→ Module expands to show sub-lectures
```

#### 3. View Sub-Lecture Content
```
Click: Sub-lecture title
→ Content expands inline
→ Shows formatted HTML from database
→ Can collapse by clicking again
```

## Backend Processing

### Save Flow (CourseLectureController@store)

```
POST request with lectures array
↓
Authorization check: role_id 2 (teacher) or 1 (admin)
↓
Course ownership check: Only teacher's courses
↓
Database transaction BEGIN
↓
For each lecture in array:
  ├─ Check if temporary ID (Date.now() > 2147483647)
  ├─ If temporary → CREATE new with all fields
  │   • parent_lecture_id
  │   • level
  │   • order
  │   • content
  └─ If existing ID → UPDATE with new content
     • Preserve parent_lecture_id if not changed
     • Update content
     • Update level/order if provided
↓
Commit transaction
↓
Reload and return all lectures ordered by:
  1. Level (0 = root first)
  2. Parent ID
  3. Order
↓
Return 200 with lectures array
```

### Temporary ID Detection
```javascript
// Frontend creates with temporary ID
const newLecture = {
  id: Date.now(),  // e.g., 1731574800123
  parent_lecture_id: parentId,
  title: title,
  content: '',
  level: 1,
  order: childCount + 1
}

// Backend detects
$isTemporaryId = !is_numeric($id) || $id > 2147483647 || $id < 1;
// Result: true → Create new lecture
```

## Content Persistence

### When Content is Saved
```
1. Teacher clicks "Save" in editor
2. Frontend collects all lectures:
   - Including the one being edited with new content
   - Preserves hierarchy (parent_lecture_id, level)
3. POST to /api/courses/{courseId}/lectures
4. Backend:
   - Updates the edited lecture with new content
   - Preserves all other lectures
   - Saves to database
5. Frontend receives updated lectures
6. State updated with real content
7. Students now see it when they load course
```

### Database Storage
```sql
-- Root lecture (module)
INSERT INTO course_lectures 
  (course_id, parent_lecture_id, title, content, level, order, created_by)
VALUES 
  (1, NULL, 'Module 1', '<h2>Introduction</h2>...', 0, 1, 2);

-- Sub-lecture with content
INSERT INTO course_lectures 
  (course_id, parent_lecture_id, title, content, level, order, created_by)
VALUES 
  (1, 1, 'Chapter 1', '<p>Getting started...</p>', 1, 1, 2);
```

## Student Viewing

### API Call
```
GET /api/courses/{courseId}/lectures
Authorization: Bearer {studentToken}
↓
Returns all lectures including content
```

### Frontend Display
```javascript
// Student gets all lectures
[
  {
    id: 1,
    parent_lecture_id: null,
    title: "Module 1: Introduction",
    content: "<h2>Introduction</h2>...",
    level: 0
  },
  {
    id: 2,
    parent_lecture_id: 1,
    title: "Chapter 1: Getting Started",
    content: "<p>Getting started...</p>",
    level: 1
  }
]

// HierarchicalLectureContent component renders:
Module 1: Introduction [EXPAND ARROW]
  └─ Chapter 1: Getting Started
     ↓ (Click to expand)
     <p>Getting started...</p>
```

## Error Handling

### Frontend Errors
- ❌ Empty title → Show error toast, disable save
- ❌ API error → Show error message with details
- ❌ Network error → Show connection error toast

### Backend Errors
- ❌ 403 Unauthorized → User not teacher/admin
- ❌ 403 Course ownership → Teacher not owner
- ❌ 400 Invalid data → Missing required fields
- ❌ 500 Database error → Transaction rolled back

## Testing Checklist

### Teacher Flow
- [ ] Add module (root lecture)
- [ ] Module appears with ID in list
- [ ] Click "+" to add sub-lecture
- [ ] Enter sub-title and click "Create"
- [ ] Sub-lecture appears in expanded module
- [ ] Green banner shows unsaved count
- [ ] Click "Save All"
- [ ] Banner disappears
- [ ] Refresh page → Data persists
- [ ] Click Edit on sub-lecture
- [ ] Add content with WYSIWYG editor
- [ ] Click "Save"
- [ ] Toast: "Saved successfully!"

### Student Flow
- [ ] Navigate to course materials
- [ ] See module with sub-lectures
- [ ] Click module to expand
- [ ] Click sub-lecture
- [ ] See content from teacher
- [ ] Refresh page → Content still there
- [ ] Close and reopen → Content loads

### Database
- [ ] Check parent_lecture_id is set correctly
- [ ] Check level values (0 for root, 1 for sub)
- [ ] Check content field has HTML
- [ ] Check timestamps are set
- [ ] Delete lecture → Children deleted

## Troubleshooting

### Issue: Sub-lectures not appearing
```
✓ Check: parent_lecture_id is set in database
✓ Check: Frontend sends parent_lecture_id
✓ Check: Level field is correct (1 for sub)
```

### Issue: Content not saving
```
✓ Check: Button says "Save" not "Add"
✓ Check: API returns success: true
✓ Check: Database has content field
✓ Check: No JavaScript errors in console
```

### Issue: Students can't see content
```
✓ Check: GET /api/courses/{courseId}/lectures is accessible
✓ Check: Student is enrolled in course
✓ Check: Content field is not empty
✓ Check: isTeacher={false} in component
```

### Issue: Delete removes wrong items
```
✓ Check: Only deleting root lectures, not sub
✓ Check: Cascade delete working for children
✓ Check: Database constraints in place
```

## Performance Considerations

- ✅ Hierarchical indexes on parent_lecture_id and course_id
- ✅ Single API call loads all lectures (not recursive)
- ✅ Frontend handles rendering, not backend pagination
- ✅ Content in longtext field (supports large HTML)

## Future Enhancements

1. Drag-to-reorder lectures (maintain order)
2. Duplicate lecture feature
3. Keyboard shortcuts (Ctrl+S for Save)
4. Auto-save with debounce (optional)
5. Revision history / Audit trail
6. Bulk import/export (CSV)
