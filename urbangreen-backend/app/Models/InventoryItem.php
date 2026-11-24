<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'name', 'category', 'quantity', 'unit', 'low_stock_level', 'notes',
    ];

    protected $casts = [
        'quantity' => 'float',
        'low_stock_level' => 'float',
    ];

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->low_stock_level;
    }
}