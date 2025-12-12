<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GarbageTerminal extends Model
{
    use HasFactory;

    
    protected $fillable = [
    'name',
    'zone_id',
    'lat',
    'lng',
    'household_count',
    'establishment_count',
    'estimated_biodegradable',
    'estimated_non_biodegradable',
    'estimated_recyclable',
    'qr_code',
    'is_active'
                ];

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
