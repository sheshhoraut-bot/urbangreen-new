<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlantJournalEntry extends Model
{
    protected $fillable = [
        'plant_id', 'user_id', 'entry_date', 'growth_stage', 'height_cm',
        'notes', 'is_harvest', 'harvest_amount', 'harvest_unit',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'is_harvest' => 'boolean',
        'height_cm' => 'float',
        'harvest_amount' => 'float',
    ];

    public function plant(): BelongsTo
    {
        return $this->belongsTo(Plant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}