<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteTracking extends Model
{
    use HasFactory;
       protected $fillable = [
        'schedule_id',
        'data',
    ];

    protected $casts = [
        'data' => 'array', 
    ];
}
