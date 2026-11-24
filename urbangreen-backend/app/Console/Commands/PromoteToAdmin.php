<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteToAdmin extends Command
{
    protected $signature = 'user:promote {email}';
    protected $description = 'Promote a user to admin by email (use this if you get locked out of admin access)';

    public function handle(): int
    {
        $email = $this->argument('email');
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("No user found with email: {$email}");
            return self::FAILURE;
        }

        $user->update(['role' => 'admin']);
        $this->info("{$user->name} ({$email}) is now an admin.");

        return self::SUCCESS;
    }
}