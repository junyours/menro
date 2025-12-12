<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\BarangayProfile;
use Illuminate\Support\Facades\Auth;

class BarProfileController extends Controller
{
 public function index()
{
    $user = Auth::user();

    $barangayProfile = BarangayProfile::with([
        'zoneLeaders.zones.garbageTerminals'
    ])
    ->where('user_id', $user->id)
    ->first();

    // Active leaders for assigning new zones
    $activeLeaders = $barangayProfile
        ? $barangayProfile->zoneLeaders->where('is_active', true)
        : collect();

    // All zones for duplicate route path validation
    $allZones = $barangayProfile
        ? $barangayProfile->zoneLeaders->flatMap(function($leader) {
            return $leader->zones;
        })
        : collect();

    // Zones to display in BarProfile (only active leaders)
    $zones = $activeLeaders->flatMap(function ($leader) {
        return $leader->zones->map(function ($zone) use ($leader) {
            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'route_path' => $zone->route_path,
                'garbage_terminals' => $zone->garbageTerminals,
                'zone_leader' => [
                    'id' => $leader->id,
                    'name' => $leader->firstname . ' ' . $leader->lastname,
                    'email' => $leader->email,
                ],
            ];
        });
    });

    return Inertia::render('BarProfile', [
        'auth' => ['user' => $user],
        'barangayProfile' => $barangayProfile,
        'zonalLeaders' => $activeLeaders->values(), // for dropdown
        'zones' => $zones,
        'allZones' => $allZones->values(), // for duplicate route validation
    ]);
}

}
