<?php
// Simple PHP script to POST /api/login and GET /api/courses using the returned token
function post($url, $data) {
    $payload = json_encode($data);
    $opts = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\nAccept: application/json\r\n",
            'content' => $payload,
            'timeout' => 10,
        ]
    ];
    $context = stream_context_create($opts);
    return @file_get_contents($url, false, $context);
}

function get($url, $token = null) {
    $ch = curl_init($url);
    $headers = [
        'Accept: application/json',
    ];
    if ($token) $headers[] = 'Authorization: Bearer ' . $token;
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['body' => $body, 'status' => $status, 'error' => $err];
}

$loginRaw = post('http://127.0.0.1:8000/api/login', ['email' => 'student1@gmail.com', 'password' => 'admin123']);
if ($loginRaw === false) {
    echo "ERROR: login request failed\n";
    exit(1);
}
$login = json_decode($loginRaw, true);
echo "---LOGIN-RESPONSE---\n";
echo $loginRaw . "\n";
$token = $login['token'] ?? null;
if (!$token) {
    echo "ERROR: no token found in login response\n";
    exit(1);
}

echo "---TOKEN---\n" . $token . "\n";

$coursesResp = get('http://127.0.0.1:8000/api/courses', $token);
if ($coursesResp['body'] === false || $coursesResp['status'] >= 500) {
    echo "ERROR: courses request failed (HTTP " . $coursesResp['status'] . ")\n";
    if (!empty($coursesResp['error'])) echo "cURL error: " . $coursesResp['error'] . "\n";
    if (!empty($coursesResp['body'])) {
        echo "Response body:\n" . $coursesResp['body'] . "\n";
    }
    exit(1);
}

echo "---COURSES-RESPONSE---\n";
echo $coursesResp['body'] . "\n";

?>