<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RouteTracking;

class RouteTrackingController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'scheduleId'   => 'required|integer',
            'scheduleName' => 'required|string',
            'barangayName' => 'required|string',
            'truckInfo'    => 'nullable|string',
            'zones'        => 'required|array'
        ]);

        // Save or update
        $tracking = RouteTracking::updateOrCreate(
            ['schedule_id' => $data['scheduleId']],
            ['data' => $data] // Laravel handles JSON automatically
        );

        return response()->json([
            'message' => 'Route saved successfully',
            'tracking' => $tracking
        ]);
    }

    public function show($scheduleId)
    {
        $tracking = RouteTracking::where('schedule_id', $scheduleId)->first();

        if (!$tracking) {
            return response()->json(['message' => 'Route not found'], 404);
        }

        // Already cast to array — no decode needed
        return response()->json($tracking->data);
    }
}
