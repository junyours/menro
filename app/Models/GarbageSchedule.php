<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Helpers\NotificationHelper;

class GarbageSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'truck_id',
        'driver_id',
        'barangay_id',
        'pickup_datetime',
        'status',
        'remarks',
        'completed_at',
    ];

    // 🔹 Automatically send push notification when new schedule is created
    protected static function booted()
    {
        static::created(function ($schedule) {
            $schedule->notifyDriver();
        });
    }

    // 🔔 Notify driver via FCM
    public function notifyDriver()
    {
        if (!$this->driver || !$this->driver->user_id) return;

        $message = 'You have a new garbage collection schedule on ' . date('F j, Y g:i A', strtotime($this->pickup_datetime));

        NotificationHelper::sendToUser(
            $this->driver->user_id,
            'New Garbage Collection Schedule',
            $message,
            [
                'schedule_id' => $this->id,
                'truck_id' => $this->truck_id,
                'barangay_id' => $this->barangay_id,
            ]
        );
    }

    // 🔹 Relationships
    public function route_details(): HasMany
    {
        return $this->hasMany(RouteDetails::class, 'schedule_id');
    }

    public function truck()
    {
        return $this->belongsTo(Truck::class);
    }

    public function driver()
    {
        return $this->belongsTo(DriverProfile::class, 'driver_id');
    }

    public function barangay()
    {
        return $this->belongsTo(BarangayProfile::class, 'barangay_id');
    }

    public function zones()
    {
        return $this->belongsToMany(
            WeeklyZoneReport::class,
            'garbage_schedule_zone',
            'schedule_id',
            'zone_id'
        );
    }

    public function route_plans(): HasMany
    {
        return $this->hasMany(RoutePlan::class, 'schedule_id');
    }

    public function routeSummary()
    {
        return $this->hasOne(RouteSummary::class, 'schedule_id');
    }

    public function reschedules()
    {
        return $this->hasMany(ReSchedule::class, 'schedule_id');
    }
}
