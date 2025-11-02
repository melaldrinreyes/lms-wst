-- Update all modules that have files to published status
UPDATE modules 
SET status = 'published' 
WHERE file_path IS NOT NULL 
AND status = 'draft';

-- Check the results
SELECT id, module_title, status, file_path, created_at, updated_at
FROM modules
WHERE file_path IS NOT NULL;
