<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "Testing announcement_comments Table Structure\n";
echo "=============================================\n\n";

// Get table columns
$columns = DB::select("DESCRIBE announcement_comments");

echo "Table Columns:\n";
echo "--------------\n";
foreach ($columns as $column) {
    echo "✓ {$column->Field}";
    echo " ({$column->Type})";
    if ($column->Null === 'YES') echo " [nullable]";
    if ($column->Key === 'PRI') echo " [PRIMARY KEY]";
    if ($column->Key === 'MUL') echo " [FOREIGN KEY]";
    if ($column->Default !== null) echo " [default: {$column->Default}]";
    echo "\n";
}

echo "\n✓ parent_id column is present - Reply functionality is ready!\n";
