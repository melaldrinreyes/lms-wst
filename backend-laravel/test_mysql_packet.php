<?php
// Quick test to check MySQL max_allowed_packet
echo "===========================================\n";
echo "MySQL Configuration Test\n";
echo "===========================================\n\n";

$conn = new mysqli('127.0.0.1', 'root', '', 'minsu_lms_db');

if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error . "\n");
}

echo "✅ Connected to MySQL successfully\n\n";

// Check max_allowed_packet
$result = $conn->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
$row = $result->fetch_assoc();
$bytes = $row['Value'];
$mb = round($bytes / 1024 / 1024, 2);

echo "Current max_allowed_packet:\n";
echo "  - Bytes: " . number_format($bytes) . "\n";
echo "  - Size: " . $mb . " MB\n\n";

if ($mb >= 64) {
    echo "✅ GOOD: max_allowed_packet is " . $mb . "MB (≥64MB required)\n";
} else {
    echo "❌ BAD: max_allowed_packet is only " . $mb . "MB (need 64MB)\n";
    echo "   Please restart MySQL service in XAMPP!\n";
}

// Check PHP limits
echo "\n-------------------------------------------\n";
echo "PHP Configuration:\n";
echo "-------------------------------------------\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "s\n";

$conn->close();
echo "\n===========================================\n";
