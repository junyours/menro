<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoutePlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'zone_id',
        'status',
        'completed_at',
    ];

    public function schedule()
    {
        return $this->belongsTo(GarbageSchedule::class);
    }

     public function routeDetails()
    {
        return $this->hasMany(RouteDetails::class, 'route_plan_id');
    }


    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function legs()
    {
        return $this->hasMany(RouteDetails::class);
    }

    // ✅ Compute progress dynamically
    public function calculateProgress(): array
    {
        $total     = $this->legs()->count();
        $completed = $this->legs()->where('status', 'completed')->count();
        $missed    = $this->legs()->where('status', 'missed')->count();

        $status = 'ongoing';
        if ($total > 0 && $completed === $total) {
            $status = 'completed';
        } elseif ($total > 0 && $completed + $missed === $total) {
            $status = 'finished_with_missed';
        } elseif ($total === 0) {
            $status = 'pending';
        }

        return [
            'total'     => $total,
            'completed' => $completed,
            'missed'    => $missed,
            'status'    => $status,
        ];
    }

    // ✅ Update RoutePlan in DB
    public function updateProgress()
    {
        $progress = $this->calculateProgress();

        $this->status = $progress['status'];
        $this->completed_at = $progress['status'] === 'completed' ? now() : null;
        $this->save();

        return $progress;
    }
}
