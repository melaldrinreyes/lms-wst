<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     * 
     * @param string|array $roles Comma-separated string or array of allowed role IDs
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login to continue.',
            ], 401);
        }

        // Convert roles to array if comma-separated string
        if (count($roles) === 1 && str_contains($roles[0], ',')) {
            $roles = explode(',', $roles[0]);
        }

        // Check if user's role is in allowed roles
        if (!in_array($user->role_id, $roles)) {
            \Log::warning('Unauthorized access attempt', [
                'user_id' => $user->id,
                'user_role' => $user->role_id,
                'required_roles' => $roles,
                'route' => $request->path(),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access. You do not have permission to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
