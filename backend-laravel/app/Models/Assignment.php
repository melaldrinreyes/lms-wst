<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'due_date',
        'max_points',
        'file_path',
        'status',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'max_points' => 'integer',
    ];

    /**
     * Get the course for the assignment
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the submissions for the assignment
     */
    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
