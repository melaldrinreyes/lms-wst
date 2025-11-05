<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'content',
        'created_by',
        'priority',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the course that owns the announcement
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who created the announcement
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the comments for the announcement
     */
    public function comments()
    {
        return $this->hasMany(AnnouncementComment::class);
    }
}
