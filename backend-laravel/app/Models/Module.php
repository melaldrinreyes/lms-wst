<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'content',
        'order',
        'status',
        'file_path',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    /**
     * Get the course for the module
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
