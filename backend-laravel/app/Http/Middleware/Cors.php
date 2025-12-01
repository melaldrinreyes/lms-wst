<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        // Handle preflight OPTIONS request
        if ($request->getMethod() === "OPTIONS") {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Range, Accept-Encoding')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);
        
        // Handle BinaryFileResponse (file downloads) differently
        if ($response instanceof BinaryFileResponse) {
            $response->headers->set('Access-Control-Allow-Origin', $request->header('Origin') ?? '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Range, Accept-Encoding');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
            return $response;
        }

        return $response
            ->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Range, Accept-Encoding')
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    }
}
