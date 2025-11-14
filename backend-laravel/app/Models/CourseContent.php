<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseContent extends Model
{
    use HasFactory;

    protected $table = 'course_content';

    protected $fillable = [
        'course_id',
        'content',
        'created_by',
    ];

    /**
     * Get the course that owns this content
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who created this content
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all attachments for this content
     */
    public function attachments()
    {
        return $this->hasMany(ContentAttachment::class);
    }

    /**
     * Get all versions of this content
     */
    public function versions()
    {
        return $this->hasMany(ContentVersion::class)->orderBy('version_number', 'desc');
    }

    /**
     * Get the latest version
     */
    public function latestVersion()
    {
        return $this->hasOne(ContentVersion::class)->orderBy('version_number', 'desc');
    }
}
