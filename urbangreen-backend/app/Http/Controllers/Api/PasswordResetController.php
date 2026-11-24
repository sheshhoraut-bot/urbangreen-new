<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class PasswordResetController extends Controller
{
    /**
     * Send a reset link by email. The answer is always the same, whether or not
     * the address belongs to an account, so nobody can use this to find out
     * which emails are registered.
     */
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        ResetPassword::createUrlUsing(function ($user, string $token) {
            $base = rtrim(config('frontend.url'), '/');

            return $base . '/?reset_token=' . $token . '&email=' . urlencode($user->getEmailForPasswordReset());
        });

        try {
            Password::sendResetLink(['email' => $data['email']]);
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'If that email is registered, a reset link has been sent. Check your inbox.',
            'data' => [],
        ]);
    }

    /**
     * Set the new password using the token from the email.
     */
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token' => $data['token'],
            ],
            function (User $user, string $password) {
                // The User model hashes this automatically
                $user->password = $password;
                $user->save();

                // Sign the user out everywhere
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => 'This reset link is invalid or has expired. Please request a new one.',
                'data' => [],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your password has been reset. You can now log in.',
            'data' => [],
        ]);
    }
}