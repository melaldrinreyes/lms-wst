<?php

// Cleanup: revert faculty update
require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

DB::table('assignments')->where('id', 16)->update(['updated_by_faculty_at' => null]);
echo "Reverted faculty update for assignment 16.\n";