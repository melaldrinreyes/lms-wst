<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContentVersion extends Model
{
    use HasFactory;

    protected $table = 'content_versions';

    protected $fillable = [
        'course_content_id',
        'content',
        'change_description',
        'created_by',
        'version_number',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'version_number' => 'integer',
    ];

    /**
     * Get the course content this version belongs to
     */
    public function courseContent()
    {
        return $this->belongsTo(CourseContent::class);
    }

    /**
     * Get the user who created this version
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the next version
     */
    public function nextVersion()
    {
        return $this->courseContent
            ->versions()
            ->where('version_number', '>', $this->version_number)
            ->orderBy('version_number', 'asc')
            ->first();
    }

    /**
     * Get the previous version
     */
    public function previousVersion()
    {
        return $this->courseContent
            ->versions()
            ->where('version_number', '<', $this->version_number)
            ->orderBy('version_number', 'desc')
            ->first();
    }
}
