<?php

// app/Models/WeeklyReport.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeeklyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'barangay_id',
        'comply_on',
        'submitted_at',
        'is_open',
        'status',
    ];

    protected $casts = [
        'cpmply_on' => 'datetime',
        'submitted_at' => 'datetime',
    ];


    public function barangay()
    {
        return $this->belongsTo(BarangayProfile::class);
    }

    public function zoneReports()
{
    return $this->hasMany(WeeklyZoneReport::class);
}

public function scopeCurrent($query)
{
    return $query->whereDate('comply_on', now()->toDateString());
}

public function scopePending($query)
{
    return $query->where('status', 'pending');
}
}
