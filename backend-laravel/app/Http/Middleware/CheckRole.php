<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, $role)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($user->role_id != $role) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access. Super Admin privileges required.',
            ], 403);
        }

        return $next($request);
    }
}
