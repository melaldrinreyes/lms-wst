<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnnouncementComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'announcement_id',
        'user_id',
        'parent_id',
        'comment',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the announcement that owns the comment
     */
    public function announcement()
    {
        return $this->belongsTo(Announcement::class);
    }

    /**
     * Get the user who created the comment
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent comment (for replies)
     */
    public function parent()
    {
        return $this->belongsTo(AnnouncementComment::class, 'parent_id');
    }

    /**
     * Get all replies to this comment (recursive)
     */
    public function replies()
    {
        return $this->hasMany(AnnouncementComment::class, 'parent_id')
            ->with(['user', 'replies']) // Recursive loading of nested replies
            ->orderBy('created_at', 'asc');
    }
}
