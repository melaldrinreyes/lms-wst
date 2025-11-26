<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssignmentFile extends Model
{
    protected $fillable = [
        'assignment_id',
        'file_path',
        'original_name',
    ];

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }
}
