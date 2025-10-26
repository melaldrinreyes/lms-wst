<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'status',
        'message',
        'requested_at',
        'responded_at',
        'responded_by',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    /**
     * Get the student who made the request
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Get the course for the request
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who responded to the request
     */
    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}
