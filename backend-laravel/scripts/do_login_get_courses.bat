@echo off
cd /d %~dp0
REM POST login and save response
curl -s -X POST "http://127.0.0.1:8000/api/login" -H "Accept: application/json" -H "Content-Type: application/json" -d "{\"email\":\"student1@gmail.com\",\"password\":\"admin123\"}" -o tmp_login.json
echo ---LOGIN-RESPONSE---
type tmp_login.json












del tmp_courses.json >nul 2>&1del tmp_login.json >nul 2>&1
nrem cleanup temp filestype tmp_courses.jsoncurl -s -X GET "http://127.0.0.1:8000/api/courses" -H "Accept: application/json" -H "Authorization: Bearer %TOKEN%" -o tmp_courses.jsonecho ---COURSES-RESPONSE---
nrem Use token to call courses endpointecho %TOKEN%echo ---TOKEN---for /f "usebackq delims=" %%a in (`php -r "echo json_decode(file_get_contents('tmp_login.json'), true)['token'];"`) do set TOKEN=%%anrem Extract token using PHP CLI and store in TOKEN variable