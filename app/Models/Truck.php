<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Truck extends Model
{
    use HasFactory;

    protected $fillable = [
        'plate_number',
        'model',
        'status',
    ];
  public function drivers()
    {
        return $this->hasMany(DriverProfile::class, 'assigned_truck_id');
    }
}

