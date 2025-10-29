<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'module_title',
        'description',
        'content',
        'module_order',
        'status',
        'file_path',
    ];

    protected $casts = [
        'module_order' => 'integer',
    ];

    protected $appends = ['title', 'order'];

    /**
     * Accessor for title (maps module_title)
     */
    public function getTitleAttribute()
    {
        return $this->module_title;
    }

    /**
     * Accessor for order (maps module_order)
     */
    public function getOrderAttribute()
    {
        return $this->module_order;
    }

    /**
     * Get the course for the module
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
