<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\GarbageSchedule;

class RouteDetails extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'from_zone_id',
        'from_terminal_id',
        'to_zone_id',
        'to_terminal_id',
        'distance_km',
        'distance_m',
        'duration_min',
        'speed_kmh',
        'status',
        'start_time',
        'completed_at',
        'remarks',
        'is_viewed',
    ];
public function schedule()
{
    return $this->belongsTo(GarbageSchedule::class, 'schedule_id');
}


    public function fromZone()
    {
        return $this->belongsTo(Zone::class, 'from_zone_id');
    }

    public function toZone()
    {
        return $this->belongsTo(Zone::class, 'to_zone_id');
    }

    public function fromTerminal()
    {
        return $this->belongsTo(GarbageTerminal::class, 'from_terminal_id');
    }

    public function toTerminal()
    {
        return $this->belongsTo(GarbageTerminal::class, 'to_terminal_id');
    }
    public function wasteCollections()
{
    return $this->hasMany(WasteCollections::class, 'route_detail_id');
}
}