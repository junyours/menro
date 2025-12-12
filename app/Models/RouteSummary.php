<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteSummary extends Model
{
    use HasFactory;

     protected $fillable = [
        'schedule_id',
        'completed_count',
        'missed_count',
        'total_duration',
        'missed_reasons',
    ];

    protected $casts = [
        'missed_reasons' => 'array',
    ];

    public function schedule()
    {
        return $this->belongsTo(GarbageSchedule::class);
    }
}
