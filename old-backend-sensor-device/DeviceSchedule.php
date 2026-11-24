<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceSchedule extends Model
{
    use HasFactory;

    protected $fillable = ['device_id', 'scheduled_time', 'action', 'days', 'is_enabled'];

    protected $casts = [
        'days' => 'array',
        'is_enabled' => 'boolean',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}