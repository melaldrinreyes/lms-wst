<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassModel extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'faculty_id',
        'course_id',
        'subject_name',
        'year_level',
        'section',
        'school_year',
        'semester',
        'status',
    ];

    /**
     * Get the faculty that owns the class.
     */
    public function faculty()
    {
        return $this->belongsTo(User::class, 'faculty_id');
    }

    /**
     * Get the course/subject for this class.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the students in this class.
     */
    public function students()
    {
        return $this->belongsToMany(User::class, 'class_student', 'class_id', 'student_id')
            ->withPivot('enrolled_date', 'status')
            ->withTimestamps();
    }
}
