<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeeklyZoneReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'weekly_report_id',
        'zone_id',
        'is_segregated',
    ];

    public function weeklyReport()
    {
        return $this->belongsTo(WeeklyReport::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function schedules()
    {
        return $this->belongsToMany(GarbageSchedule::class, 'garbage_schedule_zone')
                    ->withTimestamps();
    }
}
