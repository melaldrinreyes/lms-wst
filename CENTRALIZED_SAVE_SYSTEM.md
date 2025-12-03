# Centralized Save System

## Overview

The LMS now uses a **centralized save system** that manages all save operations through a single context provider. This eliminates duplicate save logic and provides consistent saving behavior across the application.

## Architecture

```
App.jsx
  └─ SaveProvider (Context)
      ├─ HierarchicalLectureContent
      ├─ Other Components
      └─ GlobalSaveButton
```

### Core Components

#### 1. **SaveContext** (`src/contexts/SaveContext.jsx`)
Central state manager for all save operations.

**State:**
- `isSaving` - Global save status
- `isUploading` - File upload status
- `uploadProgress` - Upload progress (0-100)
- `pendingChanges` - Tracked changes by entity
- `pendingFilesMap` - Files pending upload

**Functions:**
- `saveLectures(courseId, lectures, pendingFiles)` - Save lectures with file uploads
- `uploadFile(file, onProgress)` - Upload single file
- `uploadFiles(files)` - Batch upload with progress
- `registerChange(type, id, data)` - Track entity changes
- `clearChange(type, id)` - Clear tracked changes
- `hasChanges()` - Check for pending changes
- `cancelUpload()` - Cancel ongoing upload

#### 2. **useSave Hook** (`src/hooks/useSave.js`)
React hook to access save context.

```jsx
import { useSave } from '../hooks/useSave';

function MyComponent() {
  const { isSaving, saveLectures, hasChanges } = useSave();
  // Use save functions...
}
```

#### 3. **GlobalSaveButton** (`src/components/GlobalSaveButton.jsx`)
Floating save button that appears when there are unsaved changes.

```jsx
<GlobalSaveButton 
  show={true}
  onSaveComplete={handleSave}
/>
```

## Usage

### Basic Implementation

```jsx
import { useSave } from '../hooks/useSave';

function ContentEditor({ courseId }) {
  const { 
    isSaving, 
    isUploading, 
    uploadProgress,
    saveLectures,
    pendingFilesMap,
    setPendingFilesMap 
  } = useSave();

  const handleSave = async () => {
    const result = await saveLectures(courseId, lectures, pendingFilesMap);
    
    if (result.success) {
      console.log('Saved!', result.lectures);
    } else {
      console.error('Save failed:', result.error);
    }
  };

  return (
    <div>
      {/* Content editing UI */}
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      
      {isUploading && <ProgressBar value={uploadProgress} />}
    </div>
  );
}
```

### File Upload Integration

```jsx
const { uploadFiles, setPendingFilesMap } = useSave();

// Register files for upload
const handleFileSelect = (file, lectureId) => {
  const objectUrl = URL.createObjectURL(file);
  
  setPendingFilesMap(prev => ({
    ...prev,
    [lectureId]: [
      ...(prev[lectureId] || []),
      { file, objectUrl }
    ]
  }));
  
  return objectUrl; // Use in editor
};

// Files will be uploaded when saveLectures() is called
```

### Change Tracking (Optional)

```jsx
const { registerChange, clearChange, hasChanges } = useSave();

// Track changes
const handleEdit = (lectureId, newContent) => {
  registerChange('lecture', lectureId, { content: newContent });
};

// Check if there are changes
if (hasChanges()) {
  // Show save button
}

// Clear after save
clearChange('lecture', lectureId);
```

## Features

### ✅ Single Save Point
All saves go through `saveLectures()` function - no duplicate logic.

### ✅ Batch File Uploads
Files are collected and uploaded in a single batch with combined progress tracking.

### ✅ Progress Tracking
Real-time upload progress with percentage and visual feedback.

### ✅ Error Handling
Comprehensive error handling with detailed error messages.

### ✅ Cancel Support
Users can cancel ongoing uploads via `cancelUpload()`.

### ✅ Blob URL Replacement
Automatically replaces blob URLs with real URLs after upload.

### ✅ State Synchronization
Maintains original state for change detection.

## Save Flow

```
1. User edits content
   ↓
2. Changes tracked in local state
   ↓
3. Files added to pendingFilesMap
   ↓
4. User clicks "Save All Changes"
   ↓
5. saveLectures() called
   ↓
6. Files uploaded with progress tracking
   ↓
7. Blob URLs replaced with real URLs
   ↓
8. Lectures saved to backend
   ↓
9. State updated with saved data
   ↓
10. Success notification shown
```

## Benefits

### 🎯 Consistency
- Same save logic everywhere
- Predictable behavior
- Single source of truth

### ⚡ Performance
- Batch operations reduce API calls
- Optimized file uploads
- Efficient state management

### 🛠️ Maintainability
- DRY principle (Don't Repeat Yourself)
- Centralized updates
- Easy to test

### 🎨 User Experience
- Clear visual feedback
- Progress indicators
- Error handling

## Migration Guide

### Before (Old Pattern)
```jsx
const saveLecture = async () => {
  setIsSaving(true);
  // Upload files...
  // Replace URLs...
  // Save to backend...
  setIsSaving(false);
};
```

### After (Centralized Pattern)
```jsx
const { saveLectures } = useSave();

const handleSave = async () => {
  const result = await saveLectures(courseId, lectures, pendingFiles);
  // Handle result...
};
```

## Testing

```jsx
import { SaveProvider } from '../contexts/SaveContext';
import { useSave } from '../hooks/useSave';

// Wrap component in provider
const wrapper = ({ children }) => (
  <SaveProvider>{children}</SaveProvider>
);

// Test with hook
const { result } = renderHook(() => useSave(), { wrapper });

// Test save operation
await act(async () => {
  const saveResult = await result.current.saveLectures(1, [], {});
  expect(saveResult.success).toBe(true);
});
```

## Future Enhancements

- [ ] Auto-save functionality
- [ ] Conflict resolution
- [ ] Offline support
- [ ] Undo/redo capability
- [ ] Version history
- [ ] Multi-user collaboration

## Files Modified

- ✅ `src/contexts/SaveContext.jsx` - Created
- ✅ `src/hooks/useSave.js` - Created
- ✅ `src/components/GlobalSaveButton.jsx` - Created
- ✅ `src/App.jsx` - Wrapped with SaveProvider
- ✅ `src/components/HierarchicalLectureContent.jsx` - Integrated useSave hook

---

**Last Updated:** December 4, 2025
**Version:** 1.0.0
