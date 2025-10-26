<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckDashboardAccess
{
    /**
     * Ensure users can only access their own role-specific dashboard
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login to continue.',
            ], 401);
        }

        // Map role IDs to role names
        $roleMap = [
            1 => 'admin',
            2 => 'faculty',
            3 => 'student',
        ];

        // Get the expected role from the route
        $path = $request->path();
        $pathSegments = explode('/', $path);
        
        // Check if this is a role-specific route (admin/*, faculty/*, student/*)
        if (count($pathSegments) >= 2) {
            $requestedRole = $pathSegments[1]; // Gets 'admin', 'faculty', or 'student'
            
            // Check if the requested role matches the user's role
            if (isset($roleMap[$user->role_id]) && $roleMap[$user->role_id] !== $requestedRole) {
                \Log::warning('Cross-role access attempt detected', [
                    'user_id' => $user->id,
                    'user_role' => $roleMap[$user->role_id] ?? 'unknown',
                    'requested_role' => $requestedRole,
                    'route' => $path,
                    'ip' => $request->ip(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. You cannot access resources for other user roles.',
                    'redirect' => '/api/' . $roleMap[$user->role_id],
                ], 403);
            }
        }

        return $next($request);
    }
}
