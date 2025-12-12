<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ZoneLeader extends Model
{
    use HasFactory;

    protected $table = 'zone_leader';

    protected $fillable = [
        'user_id',
        'barangay_id',
        'firstname',
        'lastname',
        'phone_number',
        'is_active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function barangay()
    {
        return $this->belongsTo(BarangayProfile::class, 'barangay_id');
    }

    public function zones()
    {
        return $this->hasMany(Zone::class, 'zone_leader_id');
    }

    public function schedules()
    {
        // This links the leader’s barangay to its schedules
        return $this->hasMany(GarbageSchedule::class, 'barangay_id', 'barangay_id');
    }

  

}
