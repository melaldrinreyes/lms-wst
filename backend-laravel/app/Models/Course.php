<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_code',
        'course_name',
        'description',
        'faculty_id',
        'credits',
        'semester',
        'year_level',
        'section',
        'academic_year',
        'thumbnail',
        'status',
    ];

    protected $casts = [
        'credits' => 'integer',
    ];

    /**
     * Get the instructor (faculty) for the course
     */
    public function instructor()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    /**
     * Get the faculty for the course (alias for instructor)
     */
    public function faculty()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    /**
     * Get the enrollments for the course
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get the assignments for the course
     */
    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Get the announcements for the course
     */
    public function announcements()
    {
        return $this->hasMany(Announcement::class);
    }

    /**
     * Get the course content
     */
    public function content()
    {
        return $this->hasOne(CourseContent::class);
    }
}
