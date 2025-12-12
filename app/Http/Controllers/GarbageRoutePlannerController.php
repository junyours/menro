<?php

// app/Http/Controllers/GarbageRoutePlannerController.php

namespace App\Http\Controllers;

use App\Models\GarbageSchedule;
use App\Models\Truck;
use App\Models\User;
use App\Models\BarangayProfile;
use App\Models\WeeklyZoneReport;
use App\Models\Zone;
use Illuminate\Http\Request;

class GarbageRoutePlannerController extends Controller
{
    public function create()
    {
        return inertia('RoutePlanner/Create', [
            'trucks' => Truck::all(),
            'drivers' => User::where('role', 'driver')->get(),
            'barangays' => BarangayProfile::all(),
            'zones' => WeeklyZoneReport::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:users,id',
            'barangay_id' => 'required|exists:barangay_profiles,id',
            'pickup_datetime' => 'required|date',
            'zone_ids' => 'required|array',
            'zone_ids.*' => 'exists:zones,id',
            'remarks' => 'nullable|string',
        ]);

        $schedule = GarbageSchedule::create([
            'truck_id' => $validated['truck_id'],
            'driver_id' => $validated['driver_id'],
            'barangay_id' => $validated['barangay_id'],
            'pickup_datetime' => $validated['pickup_datetime'],
            'status' => 1,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        $schedule->zones()->sync($validated['zone_ids']);

        return redirect()->route('dashboard')->with('success', 'Route successfully planned!');
    }
}

