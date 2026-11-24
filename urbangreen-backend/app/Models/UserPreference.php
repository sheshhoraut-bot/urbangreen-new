<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'email_notifications', 'push_notifications', 'low_battery_alerts',
        'critical_sensor_warnings', 'daily_reports', 'timezone', 'temperature_unit', 'refresh_rate',
    ];

    protected $casts = [
        'email_notifications' => 'boolean',
        'push_notifications' => 'boolean',
        'low_battery_alerts' => 'boolean',
        'critical_sensor_warnings' => 'boolean',
        'daily_reports' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}