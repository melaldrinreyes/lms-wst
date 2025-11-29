# Test script to verify course assignments now include submission status flags

Write-Host "Testing Course API for submission status flags..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Test course endpoint to see if assignments now include has_submitted and can_resubmit flags
Write-Host "Fetching course data..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/courses/1" -Method GET -Headers @{
        "Authorization" = "Bearer YOUR_TOKEN_HERE"
        "Accept" = "application/json"
    }

    Write-Host "Assignments with submission status:" -ForegroundColor Green
    foreach ($assignment in $response.course.assignments) {
        Write-Host "ID: $($assignment.id)" -ForegroundColor White
        Write-Host "  Title: $($assignment.title)" -ForegroundColor White
        Write-Host "  Has Submitted: $($assignment.has_submitted)" -ForegroundColor $(if ($assignment.has_submitted) { "Green" } else { "Red" })
        Write-Host "  Can Resubmit: $($assignment.can_resubmit)" -ForegroundColor $(if ($assignment.can_resubmit) { "Green" } else { "Red" })
        if ($assignment.submitted_at) {
            Write-Host "  Submitted At: $($assignment.submitted_at)" -ForegroundColor Yellow
        }
        Write-Host ""
    }
} catch {
    Write-Host "Error fetching course data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed. Check if has_submitted and can_resubmit flags are present." -ForegroundColor Cyan