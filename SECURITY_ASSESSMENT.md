# Security Assessment Report - MINSU LMS
**Date:** December 1, 2025  
**Project:** Learning Management System (LMS)  
**Overall Security Rating:** 6.0/10 ⚠️

---

## Executive Summary

Your LMS project demonstrates **good foundational security practices** with proper authentication, authorization, and input validation. However, several **critical vulnerabilities** exist that could expose the system to attacks. This report identifies 15+ security issues ranging from critical to low priority, with actionable recommendations.

---

## ✅ STRENGTHS - What You're Doing Right

### 1. **Strong Authentication System**
- ✅ Laravel Sanctum implementation for API token authentication
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Email validation and uniqueness checks
- ✅ Minimum 8-character password requirement
- ✅ Password confirmation on registration

### 2. **Robust Authorization (RBAC)**
- ✅ Role-based access control with 3 roles (Admin=1, Faculty=2, Student=3)
- ✅ Custom `CheckRole` middleware with strict type checking
- ✅ Protected routes with `auth:sanctum` middleware
- ✅ Logging of unauthorized access attempts
- ✅ Proper separation of admin/faculty/student routes

### 3. **Input Validation**
- ✅ Comprehensive request validation on all controllers
- ✅ Using Laravel's validation rules (required, email, exists, etc.)
- ✅ Type casting and sanitization in models
- ✅ No raw SQL queries detected (using Eloquent ORM)

### 4. **Environment Security**
- ✅ `.env` files properly excluded in `.gitignore`
- ✅ APP_KEY properly generated and secured
- ✅ Separate configurations for frontend/backend
- ✅ Debug mode appropriately set for local environment

### 5. **Session Management**
- ✅ Database-backed sessions (more secure than file-based)
- ✅ 120-minute session lifetime
- ✅ Cookie encryption enabled

---

## 🚨 CRITICAL VULNERABILITIES (Fix Immediately)

### 1. **XSS Vulnerability - Unescaped HTML Rendering** ⚠️⚠️⚠️
**Risk Level:** CRITICAL  
**Impact:** Remote code execution, session hijacking, data theft

**Issue:**
```javascript
// Found in 4+ components:
dangerouslySetInnerHTML={{ __html: content }}
```

**Attack Scenario:**
1. Attacker creates announcement/lecture with malicious JavaScript
2. Injected script executes in victim's browser
3. Attacker steals authentication tokens from localStorage
4. Full account takeover

**Affected Files:**
- `frontend-react/src/components/LectureContent.jsx` (2 instances)
- `frontend-react/src/components/HierarchicalLectureContent.jsx` (2 instances)
- `frontend-react/src/components/CourseContent.jsx` (2 instances)
- `frontend-react/src/components/Editor/RichTextEditor.jsx` (1 instance)

**Solution:** ✅ Already installed DOMPurify
```javascript
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

---

### 2. **Insecure Token Storage** ⚠️⚠️
**Risk Level:** HIGH  
**Impact:** Token theft via XSS attacks

**Issue:**
```javascript
localStorage.setItem('token', response.token);
```

**Why It's Dangerous:**
- localStorage is accessible to any JavaScript on the page
- XSS attacks can steal tokens
- No expiration enforcement on client-side
- Tokens persist even after browser closes

**Affected Files:**
- `frontend-react/src/contexts/AuthContext.jsx`
- `frontend-react/src/services/api.js`
- `frontend-react/src/lib/axios.js`

**Current Workaround:** Fix XSS vulnerabilities first (issue #1)

**Better Solution (Complex):**
- Use httpOnly cookies instead
- Implement token refresh mechanism
- Add CSRF protection

---

### 3. **Wide-Open CORS Policy** ⚠️⚠️
**Risk Level:** HIGH  
**Impact:** Unauthorized cross-origin requests

**Issue:**
```php
// In Cors.php middleware
->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*')
```

**Why It's Dangerous:**
- Accepts requests from ANY domain (`*`)
- Allows credential sharing with any origin
- Enables CSRF-like attacks from malicious sites

**Solution:**
```php
// Whitelist specific origins
$allowedOrigins = ['http://localhost:5173', 'https://yourdomain.com'];
$origin = $request->header('Origin');

if (in_array($origin, $allowedOrigins)) {
    return $response->header('Access-Control-Allow-Origin', $origin);
}
```

---

### 4. **No Rate Limiting** ⚠️⚠️
**Risk Level:** HIGH  
**Impact:** Brute force attacks, API abuse, DoS

**Issue:** No throttling on authentication or API endpoints

**Attack Scenarios:**
- Brute force password attacks (unlimited login attempts)
- Spam account registration
- API flooding/DoS attacks
- Enumeration of valid email addresses

**Solution:**
```php
// In routes/api.php
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// For general API routes
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // ... protected routes
});
```

---

### 5. **Unrestricted File Upload** ⚠️⚠️
**Risk Level:** HIGH  
**Impact:** Remote code execution, server compromise

**Issue in MediaUploadController.php:**
```php
// Line 69: MIME type validation is DISABLED
$isAllowed = true; // Temporarily allow all files
```

**Why It's Dangerous:**
- Allows uploading PHP files → Remote Code Execution
- Allows .exe, .bat files → Malware distribution
- No content verification (only extension checking)
- 200MB upload limit per file

**Affected Endpoints:**
- `/api/media/upload` - NO file type restrictions
- `/api/submissions` - 10GB limit, minimal validation

**Solution:**
```php
// Re-enable MIME type validation
$allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

if (!in_array($mimeType, $allowedMimeTypes)) {
    return response()->json(['error' => 'Invalid file type'], 422);
}

// Add file content verification (check magic bytes)
// Store files outside public webroot
// Rename files to prevent execution
```

---

## ⚠️ HIGH PRIORITY ISSUES

### 6. **Empty Database Password**
```dotenv
DB_PASSWORD=
```
- **Risk:** Anyone with database access has full control
- **Impact:** Complete data breach
- **Solution:** Set strong password for production

---

### 7. **HTTP-Only (No HTTPS)**
```dotenv
APP_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000/api
```
- **Risk:** Man-in-the-middle attacks, credential interception
- **Impact:** Passwords and tokens transmitted in plaintext
- **Solution:** Use HTTPS in production with valid SSL certificate

---

### 8. **Debug Mode Enabled**
```dotenv
APP_DEBUG=true
```
- **Risk:** Exposes sensitive error details, stack traces, file paths
- **Impact:** Information disclosure aids attackers
- **Solution:** Set `APP_DEBUG=false` in production

---

### 9. **Missing Security Headers**
**No security headers detected:**
- `X-Frame-Options` (clickjacking protection)
- `Content-Security-Policy` (XSS mitigation)
- `X-Content-Type-Options` (MIME sniffing protection)
- `Strict-Transport-Security` (HTTPS enforcement)
- `Referrer-Policy` (information leakage)

**Solution:** Add security headers middleware

---

### 10. **Overly Permissive File Permissions**
**Issue:** 10GB file upload limit per submission
```php
'file' => 'nullable|file|max:10485760', // 10GB
```
- **Risk:** Storage exhaustion DoS attack
- **Impact:** Server disk fills up, application crashes
- **Solution:** Reduce to reasonable limit (50-100MB)

---

## 🔶 MEDIUM PRIORITY ISSUES

### 11. **No CSRF Protection on State-Changing Operations**
- API uses token auth (Sanctum) but no CSRF tokens
- Vulnerable if token is compromised
- **Solution:** Implement CSRF tokens for cookie-based auth

---

### 12. **Weak Session Configuration**
```dotenv
SESSION_LIFETIME=120  # Only 2 hours
SESSION_ENCRYPT=false
```
- Sessions not encrypted
- Short timeout may frustrate users
- **Solution:** Enable encryption, adjust timeout

---

### 13. **No Account Lockout Mechanism**
- Users can attempt unlimited failed logins
- No temporary account locking after X failed attempts
- **Solution:** Implement lockout after 5 failed attempts

---

### 14. **Exposed PHP Configuration Endpoint**
```php
Route::get('/php-config', function () {
    return response()->json([
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        // ... more sensitive info
    ]);
});
```
- **Risk:** Information disclosure
- **Solution:** Remove or protect with authentication

---

### 15. **No Email Verification Enforcement**
- Fortify email verification routes exist but not enforced
- Users can use unverified email addresses
- **Solution:** Add `verified` middleware where needed

---

## 🟡 LOW PRIORITY ISSUES

### 16. **Verbose Error Logging**
- Excessive `\Log::info()` statements in production code
- May log sensitive data (user IDs, file names)
- **Solution:** Use log levels appropriately (info, debug, error)

---

### 17. **No API Versioning**
- All routes under `/api/` without versioning
- Breaking changes will affect all clients
- **Solution:** Implement `/api/v1/` structure

---

### 18. **Missing Password Complexity Requirements**
- Only requires 8 characters
- No uppercase/lowercase/special character requirements
- **Solution:** Add complexity rules

---

## 📊 SECURITY METRICS

| Category | Score | Status |
|----------|-------|--------|
| Authentication | 8/10 | ✅ Good |
| Authorization | 9/10 | ✅ Excellent |
| Input Validation | 7/10 | ⚠️ Needs Work |
| Output Encoding | 2/10 | 🚨 Critical |
| File Handling | 3/10 | 🚨 Critical |
| Network Security | 4/10 | ⚠️ Poor |
| Cryptography | 7/10 | ⚠️ Good |
| Error Handling | 5/10 | ⚠️ Needs Work |
| **Overall** | **6.0/10** | ⚠️ **Moderate Risk** |

---

## 🎯 RECOMMENDED ACTION PLAN

### **Phase 1: Critical Fixes (Do Now - 2 hours)**
1. ✅ Install DOMPurify (Already done)
2. Sanitize all `dangerouslySetInnerHTML` usage (7 files)
3. Add rate limiting to auth routes
4. Re-enable file type validation in MediaUploadController
5. Configure specific CORS origins

### **Phase 2: High Priority (This Week - 4 hours)**
6. Add security headers middleware
7. Set strong database password
8. Disable debug mode for production
9. Reduce file upload limits
10. Remove/protect PHP config endpoint

### **Phase 3: Medium Priority (This Month - 8 hours)**
11. Implement account lockout mechanism
12. Enable session encryption
13. Add CSRF protection
14. Implement email verification enforcement
15. Add API rate limiting

### **Phase 4: Low Priority (Future - 16 hours)**
16. Clean up excessive logging
17. Implement API versioning
18. Enhance password complexity requirements
19. Consider httpOnly cookie authentication
20. Add security monitoring/alerting

---

## 🔧 QUICK FIXES - Code Snippets

### Fix #1: XSS Protection (All Files)
```javascript
// Add to each file using dangerouslySetInnerHTML
import DOMPurify from 'dompurify';

// Replace this:
<div dangerouslySetInnerHTML={{ __html: content }} />

// With this:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

### Fix #2: Rate Limiting
```php
// backend-laravel/routes/api.php
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware(['auth:sanctum', 'throttle:100,1'])->group(function () {
    // All your protected routes
});
```

### Fix #3: Strict CORS
```php
// backend-laravel/app/Http/Middleware/Cors.php
private function getAllowedOrigins(): array
{
    return [
        'http://localhost:5173',
        'http://localhost:3000',
        // Add production domains here
    ];
}

public function handle(Request $request, Closure $next)
{
    $origin = $request->header('Origin');
    $allowedOrigins = $this->getAllowedOrigins();
    
    if (!in_array($origin, $allowedOrigins)) {
        return response()->json(['error' => 'Origin not allowed'], 403);
    }
    
    // ... rest of CORS logic
}
```

### Fix #4: File Upload Security
```php
// MediaUploadController.php - Line 69
// Remove this:
$isAllowed = true;

// Uncomment the validation code above it
```

### Fix #5: Security Headers Middleware
```php
// Create: app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next)
{
    $response = $next($request);
    
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return $response;
}

// Register in bootstrap/app.php
$middleware->api(prepend: [
    \App\Http\Middleware\SecurityHeaders::class,
]);
```

---

## 📋 COMPLIANCE NOTES

### OWASP Top 10 Coverage:
- ✅ A01: Broken Access Control - **GOOD** (RBAC implemented)
- 🚨 A02: Cryptographic Failures - **POOR** (HTTP, weak session config)
- 🚨 A03: Injection - **GOOD** (Using ORM, but XSS vulnerable)
- ⚠️ A04: Insecure Design - **MODERATE** (Some design flaws)
- ⚠️ A05: Security Misconfiguration - **POOR** (Debug on, open CORS)
- ⚠️ A06: Vulnerable Components - **UNKNOWN** (Need dependency audit)
- ✅ A07: ID & Auth Failures - **GOOD** (Sanctum, password hashing)
- ⚠️ A08: Software & Data Integrity - **MODERATE** (No checksums)
- 🚨 A09: Security Logging - **POOR** (No anomaly detection)
- ⚠️ A10: SSRF - **MODERATE** (Not extensively tested)

---

## 🎓 SECURITY BEST PRACTICES FOR YOUR TEAM

1. **Never trust user input** - Always validate and sanitize
2. **Use parameterized queries** - You're doing this ✅
3. **Implement least privilege** - You're doing this ✅
4. **Encrypt sensitive data** - Implement in transit (HTTPS)
5. **Log security events** - Implement monitoring
6. **Keep dependencies updated** - Run `npm audit` and `composer audit`
7. **Regular security testing** - Schedule penetration tests
8. **Security code reviews** - Review pull requests for security

---

## 📞 CONCLUSION

Your LMS has a **solid security foundation** but requires **immediate attention** to critical XSS and file upload vulnerabilities. The authentication and authorization systems are well-implemented, but the application layer security needs strengthening.

**Recommended Timeline:**
- ⏰ **Today:** Fix XSS vulnerabilities (Critical)
- ⏰ **This Week:** Rate limiting, CORS, file uploads (High)
- ⏰ **This Month:** Security headers, session config (Medium)

**Estimated Effort:** 14 hours total to reach 8.5/10 security rating

---

**Report Generated:** December 1, 2025  
**Next Review:** After implementing Phase 1-2 fixes  
**Contact:** Review this report with your development team
