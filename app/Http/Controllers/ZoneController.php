<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\ZoneLeader;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ZoneController extends Controller
{
    /**
     * Display all zones.
     */
    public function index()
    {
        $zones = Zone::with(['zoneLeader.user'])->get()->map(function ($zone) {
            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'route_path' => $zone->route_path,
                'zone_leader' => [
                    'id' => $zone->zoneLeader->id,
                    'name' => $zone->zoneLeader->firstname . ' ' . $zone->zoneLeader->lastname,
                    'email' => $zone->zoneLeader->user->email,
                ],
            ];
        });

        return Inertia::render('Map', [
            'zones' => $zones,
        ]);
    }

    /**
     * Show form for creating a new zone.
     */
    public function create()
    {
        return Inertia::render('Zone/Create');
    }

    /**
     * Store a newly created zone.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'zone_leader_id' => 'required|exists:zone_leader,id',
            'route_path'     => 'nullable|array',
            'route_path.*.lat' => 'required|numeric',
            'route_path.*.lng' => 'required|numeric',
        ]);

        // Fetch the zonal leader
        $zoneLeader = ZoneLeader::findOrFail($validated['zone_leader_id']);

        // Get all existing zones for this leader
        $existingZones = Zone::where('zone_leader_id', $zoneLeader->id)->get();

        // Check duplicate coordinates
        if (!empty($validated['route_path'])) {
            foreach ($validated['route_path'] as $newPoint) {
                foreach ($existingZones as $zone) {
                    $existingPath = $zone->route_path ?? [];
                    foreach ($existingPath as $point) {
                        if (
                            floatval($point['lat']) === floatval($newPoint['lat']) &&
                            floatval($point['lng']) === floatval($newPoint['lng'])
                        ) {
                            return back()->withErrors([
                                'route_path' => "The coordinate ({$newPoint['lat']}, {$newPoint['lng']}) already exists in zone '{$zone->name}'."
                            ])->withInput();
                        }
                    }
                }
            }
        }

        // Check zone name uniqueness inside the same barangay
        $barangayId = $zoneLeader->barangay_id;
        $leaderIds = ZoneLeader::where('barangay_id', $barangayId)->pluck('id');
        $zoneNames = Zone::whereIn('zone_leader_id', $leaderIds)->pluck('name');

        if ($zoneNames->contains($validated['name'])) {
            return back()->withErrors([
                'name' => "Zone name '{$validated['name']}' already exists in this barangay."
            ])->withInput();
        }

        // Create the new zone
        Zone::create([
            'zone_leader_id' => $validated['zone_leader_id'],
            'name'           => $validated['name'],
            'route_path'     => $validated['route_path'] ?? [],
        ]);

        return redirect()->back()->with('success', 'Zone created successfully!');
    }


   public function updateLeader(Request $request, $id)
{
    $request->validate([
        'zone_leader_id' => 'required|exists:users,id',
    ]);

    $zone = \App\Models\Zone::findOrFail($id);
    $zone->zone_leader_id = $request->zone_leader_id;
    $zone->save();

    return response()->json([
        'success' => true,
        'message' => 'Zone leader updated successfully.',
    ]);
}


    /**
     * Update an existing zone.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'zone_leader_id'   => 'required|exists:zone_leader,id',
            'route_path'       => 'nullable|array',
            'route_path.*.lat' => 'required|numeric',
            'route_path.*.lng' => 'required|numeric',
        ]);

        $zone = Zone::findOrFail($id);

        $zoneLeader = ZoneLeader::findOrFail($validated['zone_leader_id']);

        $existingZones = Zone::where('zone_leader_id', $zoneLeader->id)
            ->where('id', '!=', $zone->id)
            ->get();

        if (!empty($validated['route_path'])) {
            foreach ($validated['route_path'] as $newPoint) {
                foreach ($existingZones as $otherZone) {
                    $existingPath = $otherZone->route_path ?? [];
                    foreach ($existingPath as $point) {
                        if (
                            floatval($point['lat']) === floatval($newPoint['lat']) &&
                            floatval($point['lng']) === floatval($newPoint['lng'])
                        ) {
                            return response()->json([
                                'message' => "The coordinate ({$newPoint['lat']}, {$newPoint['lng']}) already exists in zone '{$otherZone->name}'.",
                            ], 422);
                        }
                    }
                }
            }
        }

        $barangayId = $zoneLeader->barangay_id;
        $leaderIds = ZoneLeader::where('barangay_id', $barangayId)->pluck('id');
        $zoneNames = Zone::whereIn('zone_leader_id', $leaderIds)
            ->where('id', '!=', $zone->id)
            ->pluck('name');

        if ($zoneNames->contains($validated['name'])) {
            return response()->json([
                'message' => "Zone name '{$validated['name']}' already exists in this barangay.",
            ], 422);
        }

        $zone->update([
            'zone_leader_id' => $validated['zone_leader_id'],
            'name'           => $validated['name'],
            'route_path'     => $validated['route_path'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'zone'    => $zone->fresh(),
        ]);
    }



}
