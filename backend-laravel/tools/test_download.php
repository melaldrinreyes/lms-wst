<?php
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "Accept: */*\r\n",
        'ignore_errors' => true,
    ]
];
$context = stream_context_create($opts);
$url = 'http://127.0.0.1:8000/api/submissions/6/download';
$data = @file_get_contents($url, false, $context);
echo PHP_EOL . '--- RESPONSE HEADERS ---' . PHP_EOL;
if (isset($http_response_header)) {
    echo implode(PHP_EOL, $http_response_header) . PHP_EOL;
} else {
    echo 'No headers (request failed)' . PHP_EOL;
}
$path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'submission6.bin';
file_put_contents($path, $data === false ? '' : $data);
echo 'Saved body to: ' . $path . PHP_EOL;
if ($data === false) {
    echo 'file_get_contents returned false' . PHP_EOL;
} else {
    echo 'Body length: ' . strlen($data) . PHP_EOL;
    echo '--- BODY PREVIEW (first 2000 chars) ---' . PHP_EOL;
    echo substr($data, 0, 2000) . PHP_EOL;
}
