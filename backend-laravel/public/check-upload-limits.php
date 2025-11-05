<?php
header('Content-Type: application/json');

$info = [
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'max_input_time' => ini_get('max_input_time'),
];

echo json_encode($info, JSON_PRETTY_PRINT);
?>
