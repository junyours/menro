<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayProfile extends Model
{
   use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'zone_count',
        'is_active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function weeklyReports()
{
    return $this->hasMany(WeeklyReport::class, 'barangay_id');
}

public function zoneLeaders()
{
    return $this->hasMany(ZoneLeader::class, 'barangay_id');
}

 // Zones via zone leaders
    public function zones()
    {
        return $this->hasManyThrough(
            Zone::class,          // final model
            ZoneLeader::class,    // intermediate model
            'barangay_id',        // FK on zone_leaders
            'zone_leader_id',     // FK on zones
            'id',                 // Local key on BarangayProfile
            'id'                  // Local key on ZoneLeader
        );
    }

    // Terminals via zones (flatten manually)
    public function terminals()
    {
        return $this->zones->flatMap(function ($zone) {
            return $zone->garbageTerminals;
        });
    }
}
