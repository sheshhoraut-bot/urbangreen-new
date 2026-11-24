<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'species', 'zone_id', 'status',
        'moisture', 'planted_date', 'last_watered_at',
    ];

    protected $casts = [
        'planted_date' => 'date',
        'last_watered_at' => 'datetime',
        'moisture' => 'decimal:2',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}