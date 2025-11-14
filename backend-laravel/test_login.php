<?php
require 'vendor/autoload.php';

// Bootstrap Laravel
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Create a test request
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

$request = Request::create('/api/login', 'POST', [], [], [], [], json_encode([
    'email' => 'student@test.com',
    'password' => 'password'
]));
$request->headers->set('Content-Type', 'application/json');

echo "Request URI: " . $request->path() . "\n";
echo "Request Method: " . $request->method() . "\n";

// Handle the request
$response = app(\Illuminate\Foundation\Http\Kernel::class)->handle($request);

echo "\nResponse Status: " . $response->status() . "\n";
echo "Response Content: " . $response->getContent() . "\n";
?>
