<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'type', 'zone_id', 'is_active',
        'settings', 'last_seen_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
        'last_seen_at' => 'datetime',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DeviceSchedule::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(DeviceLog::class);
    }
}