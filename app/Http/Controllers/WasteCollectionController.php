<?php

namespace App\Http\Controllers;

use App\Models\RouteDetails;
use Illuminate\Http\Request;
use App\Models\ReschedDetails;
use App\Models\GarbageTerminal;
use App\Models\WasteCollections;

class WasteCollectionController extends Controller
{
    public function store(Request $request)
{
    $validated = $request->validate([
        'route_detail_id' => 'required|integer|exists:route_details,id',
        'biodegradable_sacks' => 'nullable|integer|min:0',
        'non_biodegradable_sacks' => 'nullable|integer|min:0',
        'recyclable_sacks' => 'nullable|integer|min:0',
    ]);

    // Get the route detail and determine its terminal
    $routeDetail = RouteDetails::findOrFail($validated['route_detail_id']);


    // Create the waste collection record
    $collection = WasteCollections::create([
        'route_detail_id' => $routeDetail->id,
        'biodegradable_sacks' => $validated['biodegradable_sacks'] ?? 0,
        'non_biodegradable_sacks' => $validated['non_biodegradable_sacks'] ?? 0,
        'recyclable_sacks' => $validated['recyclable_sacks'] ?? 0,
    ]);

    return response()->json([
        'message' => 'Waste collection saved successfully.',
        'data' => $collection,
    ]);
    }



    public function restore(Request $request)
{
    $validated = $request->validate([
        'reschedule_detail_id' => 'required|integer|exists:reschedule_details,id',
        'biodegradable_sacks' => 'nullable|integer|min:0',
        'non_biodegradable_sacks' => 'nullable|integer|min:0',
        'recyclable_sacks' => 'nullable|integer|min:0',
    ]);

    // Get the reschedule detail
    $reschedDetail = ReschedDetails::findOrFail($validated['reschedule_detail_id']);

    // Create the waste collection record
    $collection = WasteCollections::create([
        'reschedule_detail_id' => $reschedDetail->id,
        'biodegradable_sacks' => $validated['biodegradable_sacks'] ?? 0,
        'non_biodegradable_sacks' => $validated['non_biodegradable_sacks'] ?? 0,
        'recyclable_sacks' => $validated['recyclable_sacks'] ?? 0,
    ]);

    return response()->json([
        'message' => 'Waste collection saved successfully.',
        'data' => $collection,
    ]);
}

}
