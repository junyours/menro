<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TruckLocation extends Model
{
    use HasFactory;

     protected $fillable = [
        'truck_id',
        'lat',
        'lng',
    ];

    public function truck()
    {
        return $this->belongsTo(Truck::class);
    }
}
