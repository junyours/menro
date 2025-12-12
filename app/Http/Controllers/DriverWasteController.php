<?php

namespace App\Http\Controllers;

use App\Models\DriverProfile;
use App\Models\RouteDetails;
use App\Models\ReschedDetails;
use App\Models\WasteCollections;
use Illuminate\Http\Request;

class DriverWasteController extends Controller
{
    public function getDriverWasteCollections(Request $request)
    {
        $driverId = $request->input('driver_id');

        // ✅ Step 1: Resolve if driver_id came from users table
        $driverProfile = DriverProfile::where('user_id', $driverId)->first();
        if ($driverProfile) {
            $driverId = $driverProfile->id;
        }

        // ✅ Step 2: Get route_detail IDs for this driver (normal schedules)
        $routeDetailIds = RouteDetails::whereHas('schedule', function ($q) use ($driverId) {
            $q->where('driver_id', $driverId);
        })->pluck('id');

        // ✅ Step 3: Get reschedule_detail IDs for this driver
        $reschedDetailIds = ReschedDetails::whereHas('reschedule', function ($q) use ($driverId) {
            $q->where('driver_id', $driverId);
        })->pluck('id');

        // ✅ Step 4: Sum all sack types from both
        $totalBiodegradable = WasteCollections::whereIn('route_detail_id', $routeDetailIds)
            ->orWhereIn('reschedule_detail_id', $reschedDetailIds)
            ->sum('biodegradable_sacks');

        $totalNonBio = WasteCollections::whereIn('route_detail_id', $routeDetailIds)
            ->orWhereIn('reschedule_detail_id', $reschedDetailIds)
            ->sum('non_biodegradable_sacks');

        $totalRecyclable = WasteCollections::whereIn('route_detail_id', $routeDetailIds)
            ->orWhereIn('reschedule_detail_id', $reschedDetailIds)
            ->sum('recyclable_sacks');

        $grandTotal = $totalBiodegradable + $totalNonBio + $totalRecyclable;

        return response()->json([
            'success' => true,
            'driver_id' => $driverId,
            'biodegradable' => $totalBiodegradable,
            'non_biodegradable' => $totalNonBio,
            'recyclable' => $totalRecyclable,
            'total_collections' => $grandTotal,
        ]);
    }
}
