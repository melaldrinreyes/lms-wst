# LMS API ENDPOINTS - SUBMISSIONS

## Base URL
```
http://127.0.0.1:8000/api
```

---

## 1️⃣ STUDENT SUBMITS ASSIGNMENT

**Endpoint:** `POST /api/submissions`

**Authentication:** Required (Student role_id = 3)

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
assignment_id: 17
submission_text: "This is my assignment answer..."
file: [SELECT FILE]
```

**Example using JavaScript (Frontend):**
```javascript
const formData = new FormData();
formData.append('assignment_id', 17);
formData.append('submission_text', 'My detailed answer...');
formData.append('file', fileInput.files[0]); // Optional

const response = await fetch('http://127.0.0.1:8000/api/submissions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: formData
});

const data = await response.json();
console.log(data);
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Assignment submitted successfully!",
  "submission": {
    "id": 10,
    "assignment_id": 17,
    "student_id": 6,
    "submission_text": "My answer...",
    "file_path": "submissions/1730582400_6_document.pdf",
    "submitted_at": "2025-11-03T12:00:00.000000Z"
  }
}
```

---

## 2️⃣ GET ALL SUBMISSIONS (Faculty View)

**Endpoint:** `GET /api/submissions?course_id=4`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Accept: application/json
```

**Example using JavaScript:**
```javascript
const response = await fetch('http://127.0.0.1:8000/api/submissions?course_id=4', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Accept': 'application/json'
  }
});

const data = await response.json();
console.log(data.submissions); // Array of submissions
```

**Success Response (200):**
```json
{
  "success": true,
  "submissions": [
    {
      "id": 10,
      "assignment": "sdsasa",
      "student": "Paul Quisto",
      "student_email": "student1@gmail.com",
      "status": "pending",
      "grade": null,
      "submitted_at": "2025-11-03T12:00:00.000000Z",
      "file_path": "submissions/file.pdf"
    },
    {
      "id": 11,
      "assignment": "ssdfsd",
      "student": "Paul Quisto",
      "status": "graded",
      "grade": 95.00,
      "submitted_at": "2025-11-02T10:30:00.000000Z"
    }
  ]
}
```

---

## 3️⃣ FACULTY GRADES A SUBMISSION

**Endpoint:** `POST /api/submissions/{id}/grade`

**Authentication:** Required (Faculty/Admin role_id = 2 or 1)

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "grade": 95.50,
  "feedback": "Excellent work! Keep it up."
}
```

**Example using JavaScript:**
```javascript
const response = await fetch('http://127.0.0.1:8000/api/submissions/10/grade', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    grade: 95.50,
    feedback: 'Great job!'
  })
});

const data = await response.json();
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Submission graded successfully!",
  "submission": {
    "id": 10,
    "grade": 95.50,
    "feedback": "Excellent work!",
    "graded_at": "2025-11-03T12:30:00.000000Z"
  }
}
```

---

## 4️⃣ DOWNLOAD SUBMISSION FILE

**Endpoint:** `GET /api/submissions/{id}/download`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```javascript
window.open(`http://127.0.0.1:8000/api/submissions/10/download?token=${localStorage.getItem('token')}`);
```

---

## 5️⃣ GET SINGLE SUBMISSION

**Endpoint:** `GET /api/submissions/{id}`

**Authentication:** Required

**Success Response:**
```json
{
  "success": true,
  "submission": {
    "id": 10,
    "assignment": "Database Assignment 1",
    "student": "Paul Quisto",
    "submission_text": "My answer...",
    "file_path": "submissions/file.pdf",
    "grade": null,
    "status": "pending",
    "submitted_at": "2025-11-03T12:00:00.000000Z"
  }
}
```

---

## 🔐 AUTHENTICATION

All endpoints require authentication using Sanctum token.

**Login first:**
```javascript
const loginResponse = await fetch('http://127.0.0.1:8000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student1@gmail.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
localStorage.setItem('token', loginData.token);
```

---

## 📊 CURRENT TEST DATA

**Course:** Database (ID: 4)

**Students:**
- Paul Quisto (student1@gmail.com) - ID: 6

**Assignments (All Published):**
- ID 17: sdsasa
- ID 18: ssdfsd  
- ID 19: sdssd
- ID 20: sddsf
- ID 21: dss
- ID 22: 11

**Current Submissions:**
1. Paul Quisto → sdsasa (GRADED: 95/100)
2. Paul Quisto → ssdfsd (GRADED: 88.5/100)
3. Paul Quisto → sdssd (PENDING)

---

## ✅ TEST IT NOW

Open your browser console on the student page and run:
```javascript
// Login as student
const login = await fetch('http://127.0.0.1:8000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student1@gmail.com',
    password: 'password123'
  })
});
const loginData = await login.json();
console.log('Token:', loginData.token);

// Submit assignment
const formData = new FormData();
formData.append('assignment_id', 20);
formData.append('submission_text', 'My new submission!');

const submit = await fetch('http://127.0.0.1:8000/api/submissions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${loginData.token}` },
  body: formData
});
const submitData = await submit.json();
console.log('Submission:', submitData);
```
