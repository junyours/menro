<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WasteCollections extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_detail_id',
        'reschedule_detail_id',
        'biodegradable_sacks',
        'non_biodegradable_sacks',
        'recyclable_sacks',
    ];

    /**
     * Relationship: WasteCollection belongs to RouteDetail
     */
    public function routeDetail()
    {
        return $this->belongsTo(RouteDetails::class);
    }

    /**
     * Relationship: WasteCollection belongs to RescheduleDetail
     */
    public function rescheduleDetail()
    {
        return $this->belongsTo(ReschedDetails::class);
    }
}
