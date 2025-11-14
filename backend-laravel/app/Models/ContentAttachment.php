<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentAttachment extends Model
{
    use HasFactory;

    protected $table = 'content_attachments';

    protected $fillable = [
        'course_content_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'uploaded_by',
        'download_count',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'download_count' => 'integer',
    ];

    /**
     * Get the course content this attachment belongs to
     */
    public function courseContent()
    {
        return $this->belongsTo(CourseContent::class);
    }

    /**
     * Get the user who uploaded this file
     */
    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Increment download count
     */
    public function recordDownload()
    {
        $this->increment('download_count');
    }

    /**
     * Get human-readable file size
     */
    public function getFormattedFileSize()
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $i < count($units) && $bytes >= 1024; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
