@echo off
cd /d %~dp0

echo POSTing login and saving response to tmp_login.json
curl -s -X POST "http://127.0.0.1:8000/api/login" -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"email\":\"student1@gmail.com\",\"password\":\"admin123\"}" -o tmp_login.json

echo ---LOGIN-RESPONSE---
type tmp_login.json

rem Extract token using PHP CLI and store in TOKEN variable
for /f "usebackq delims=" %%a in (`php -r "echo json_decode(file_get_contents('tmp_login.json'), true)['token'];"`) do set TOKEN=%%a

echo ---TOKEN---
echo %TOKEN%

echo ---COURSES-RESPONSE---
curl -s -X GET "http://127.0.0.1:8000/api/courses" -H "Accept: application/json" -H "Authorization: Bearer %TOKEN%" -o tmp_courses.json
type tmp_courses.json

rem cleanup temp files
del tmp_login.json >nul 2>&1
del tmp_courses.json >nul 2>&1
