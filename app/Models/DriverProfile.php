<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_number',
        'contact_number',
        'assigned_truck_id',
        'is_active'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function truck()
    {
    return $this->belongsTo(Truck::class, 'assigned_truck_id');
    }

    // Regular route details through schedules
public function routeDetails()
{
    return $this->hasManyThrough(
      RouteDetails::class,
       GarbageSchedule::class,
        'driver_id',    // Foreign key on GarbageSchedule
        'schedule_id',  // Foreign key on RouteDetails
        'id',           // Local key on DriverProfile
        'id'            // Local key on GarbageSchedule
    );
}

// Rescheduled route details through schedules
public function reschedDetails()
{
    return $this->hasManyThrough(
        ReschedDetails::class,
        GarbageSchedule::class,
        'driver_id',     // Foreign key on GarbageSchedule
        'schedule_id',   // Foreign key on ReschedDetails
        'id',            // Local key on DriverProfile
        'id'             // Local key on GarbageSchedule
    );
}
}
