<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    use HasFactory;

    protected $fillable = [
        'zone_leader_id',
        'name',
        'route_path',
    ];

    protected $casts = [
        'route_path' => 'array',
    ];

   public function zoneLeader()
{
    return $this->belongsTo(ZoneLeader::class,'zone_leader_id','id');
}

    public function garbageTerminals()
{
    return $this->hasMany(GarbageTerminal::class,'zone_id', 'id');
}
}
