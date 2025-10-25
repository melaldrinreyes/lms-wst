<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'enrolled_at',
        'status',
        'final_grade',
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
        'final_grade' => 'decimal:2',
    ];

    /**
     * Get the user (student) for the enrollment
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the student for the enrollment (alias)
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the course for the enrollment
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
