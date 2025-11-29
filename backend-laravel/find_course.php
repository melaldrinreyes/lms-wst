<?php

// Find course with assignment 16
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$assignment = DB::table('assignments')->where('id', 16)->first();
$course = DB::table('courses')->where('id', $assignment->course_id)->first();

echo "Assignment 16 is in course: {$course->course_name} (ID: {$course->id})\n";