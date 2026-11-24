<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Models\UserPreference;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'] ?? 'operator',
            'status' => 'active',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:admin,operator'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    public function listUsers(): JsonResponse
    {
        $users = User::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully',
            'data' => $users,
        ]);
    }

public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
                'errors' => ['current_password' => ['Current password is incorrect']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully',
            'data' => [],
        ]);
    }

    public function recoverAdmin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'recovery_code' => ['required', 'string'],
        ]);

        if ($validated['recovery_code'] !== config('services.admin_recovery_code')) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid recovery code.',
                'errors' => [],
            ], 403);
        }

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
                'errors' => [],
            ], 401);
        }

        $user->update(['role' => 'admin']);

        return response()->json([
            'success' => true,
            'message' => 'Your account has been restored to admin.',
            'data' => [],
        ]);
    }
  public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (!Auth::attempt($validated)) {
            $this->logActivity(null, 'login_failed', "Failed login attempt for {$validated['email']}", $request);

            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
                'errors' => [],
            ], 401);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();

        if ($user->status !== 'active') {
            $this->logActivity($user->id, 'login_blocked', 'Login blocked: account inactive', $request);

            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive. Please contact an administrator.',
                'errors' => [],
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->logActivity($user->id, 'login_success', 'Successful login', $request);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    private function logActivity(?int $userId, string $action, string $description, Request $request): void
    {
        ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'ip_address' => $request->ip(),
        ]);
    }

  public function logout(Request $request): JsonResponse
    {
        $this->logActivity($request->user()->id, 'logout', 'User logged out', $request);

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
            'data' => [],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'User retrieved',
            'data' => $request->user(),
        ]);
    }

    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:admin,operator'],
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'success' => true,
            'message' => 'User role updated successfully',
            'data' => $user,
        ]);
    }

    public function deleteUser(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account while logged in.',
                'errors' => [],
            ], 422);
        }

        if ($user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the last remaining administrator.',
                    'errors' => [],
                ], 422);
            }
        }

       try { $user->tokens()->delete(); $user->forceDelete(); } catch (\Throwable $e) { report($e); return response()->json(['success' => false, 'message' => 'This account has linked records and could not be permanently deleted.', 'errors' => []], 422); }

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
            'data' => [],
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $request->user()->fresh(),
        ]);
    }

    public function getPreferences(Request $request): JsonResponse
    {
        $preferences = UserPreference::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json([
            'success' => true,
            'message' => 'Preferences retrieved successfully',
            'data' => $preferences,
        ]);
    }


    public function getLoginHistory(Request $request): JsonResponse
    {
        $logs = ActivityLog::where('user_id', $request->user()->id)
            ->whereIn('action', ['login_success', 'login_failed', 'login_blocked', 'logout'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Login history retrieved',
            'data' => $logs,
        ]);
    }
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_notifications' => ['sometimes', 'boolean'],
            'push_notifications' => ['sometimes', 'boolean'],
            'low_battery_alerts' => ['sometimes', 'boolean'],
            'critical_sensor_warnings' => ['sometimes', 'boolean'],
            'daily_reports' => ['sometimes', 'boolean'],
            'timezone' => ['sometimes', 'string'],
            'temperature_unit' => ['sometimes', 'string'],
            'refresh_rate' => ['sometimes', 'string'],
        ]);

        $preferences = UserPreference::firstOrCreate(['user_id' => $request->user()->id]);
        $preferences->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully',
            'data' => $preferences,
        ]);
    }
}