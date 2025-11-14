<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseLecture extends Model
{
    protected $table = 'course_lectures';
    
    protected $fillable = [
        'course_id',
        'parent_lecture_id',
        'title',
        'content',
        'order',
        'level',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the course that owns this lecture
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who created this lecture
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the parent lecture (if this is a sub-lecture)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(CourseLecture::class, 'parent_lecture_id');
    }

    /**
     * Get child lectures (if this is a parent)
     */
    public function children(): HasMany
    {
        return $this->hasMany(CourseLecture::class, 'parent_lecture_id')
            ->orderBy('order');
    }

    /**
     * Get all descendants recursively
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }
}
