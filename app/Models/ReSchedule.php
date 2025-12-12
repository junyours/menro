<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Helpers\NotificationHelper;

class ReSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'truck_id',
        'driver_id',
        'barangay_id',
        'pickup_datetime',
        'status',
        'completed_at',
        'remarks',
        'is_viewed',
    ];

    // 🔹 Automatically notify driver when created
    protected static function booted()
    {
        static::created(function ($reschedule) {
            $reschedule->notifyDriver();
        });
    }

    // 🔔 Notify driver
    public function notifyDriver()
    {
        if (!$this->driver || !$this->driver->user_id) return;

        $message = 'Your garbage collection has been rescheduled to ' . date('F j, Y g:i A', strtotime($this->pickup_datetime));

        NotificationHelper::sendToUser(
            $this->driver->user_id,
            'Schedule Update',
            $message,
            [
                'reschedule_id' => $this->id,
                'truck_id' => $this->truck_id,
                'barangay_id' => $this->barangay_id,
            ]
        );
    }

    // 🔹 Relationships
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

    public function details()
    {
        return $this->hasMany(ReschedDetails::class, 'reschedule_id');
    }

    public function schedule()
    {
        return $this->belongsTo(GarbageSchedule::class, 'schedule_id');
    }

    public function zones()
    {
        return $this->schedule ? $this->schedule->zones() : collect();
    }
}
