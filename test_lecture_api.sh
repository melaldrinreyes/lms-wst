#!/bin/bash

# Test script for Lecture System API

echo "=== Testing Lecture System API ==="
echo ""

# Get the API base URL
BASE_URL="http://127.0.0.1:8000/api"

# First, get a token by logging in
echo "1. Logging in to get authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to login. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Test course ID (adjust if needed)
COURSE_ID=1

echo "2. Getting lectures for course $COURSE_ID..."
LECTURES=$(curl -s -X GET "$BASE_URL/courses/$COURSE_ID/lectures" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "Response:"
echo $LECTURES | jq '.'
echo ""

echo "3. Creating a test lecture..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/courses/$COURSE_ID/lectures" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "lectures": [
      {
        "title": "Test Lecture 1",
        "content": "<h1>Test Lecture 1</h1><p>This is a test lecture.</p>",
        "order": 1
      },
      {
        "title": "Test Lecture 2",
        "content": "<h1>Test Lecture 2</h1><p>This is another test lecture.</p>",
        "order": 2
      }
    ]
  }')

echo "Response:"
echo $CREATE_RESPONSE | jq '.'
echo ""

echo "4. Getting lectures again (should show 2 lectures)..."
LECTURES=$(curl -s -X GET "$BASE_URL/courses/$COURSE_ID/lectures" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "Response:"
echo $LECTURES | jq '.'
echo ""

echo "5. Student view of lectures (without token)..."
STUDENT_VIEW=$(curl -s -X GET "$BASE_URL/courses/$COURSE_ID/lectures/view" \
  -H "Accept: application/json")

echo "Response:"
echo $STUDENT_VIEW | jq '.'
echo ""

echo "✅ API testing complete!"
