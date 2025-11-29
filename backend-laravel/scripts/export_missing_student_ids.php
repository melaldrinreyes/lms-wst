<?php
// Export users missing student_id to storage/missing_student_ids.csv
$root = dirname(__DIR__);
$envPath = $root . DIRECTORY_SEPARATOR . '.env';
$env = [];
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        $v = trim($v, "\"'");
        $env[$k] = $v;
    }
}
$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '3306';
$db   = $env['DB_DATABASE'] ?? '';
$user = $env['DB_USERNAME'] ?? 'root';
$pass = $env['DB_PASSWORD'] ?? '';
$charset = 'utf8mb4';
$dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    fwrite(STDERR, "Failed to connect to DB: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$sql = "SELECT id, email, name, created_at FROM users WHERE student_id IS NULL OR student_id = '' ORDER BY id";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

$storageDir = $root . DIRECTORY_SEPARATOR . 'storage';
if (!is_dir($storageDir)) mkdir($storageDir, 0777, true);
$outPath = $storageDir . DIRECTORY_SEPARATOR . 'missing_student_ids.csv';
$fp = fopen($outPath, 'w');
if (! $fp) {
    fwrite(STDERR, "Failed to open output file: {$outPath}\n");
    exit(1);
}
// Header
fputcsv($fp, ['id','email','name','created_at','suggested_student_id']);

foreach ($rows as $r) {
    // Suggest a candidate student id (S{year}-{id}) as optional helper
    $suggest = 'S' . date('Y') . '-' . $r['id'];
    fputcsv($fp, [$r['id'], $r['email'], $r['name'], $r['created_at'], $suggest]);
}

fclose($fp);
echo "Wrote " . count($rows) . " rows to {$outPath}\n";
exit(0);
