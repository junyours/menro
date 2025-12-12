<?php

namespace App\Http\Controllers;

use App\Models\RouteDetails;
use App\Models\RouteSummary;
use Illuminate\Http\Request;

class RouteSummaryController extends Controller
{
    /**
     * Store a new route summary.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'schedule_id' => 'required|exists:garbage_schedules,id',
            'completed_count' => 'required|integer|min:0',
            'missed_count'     => 'required|integer|min:0', 
            'total_duration' => 'required|integer|min:0',
            'missed_reasons' => 'nullable|array',
            'missed_reasons.*' => 'string|max:255',
        ]);

        $summary = RouteSummary::create([
            'schedule_id' => $validated['schedule_id'],
            'completed_count' => $validated['completed_count'],
            'missed_count'    => $validated['missed_count'],
            'total_duration' => $validated['total_duration'],
            'missed_reasons' => $validated['missed_reasons'] ?? [],
        ]);

        return response()->json([
            'message' => 'Route summary submitted successfully.',
            'data' => $summary
        ], 201);
    }



    public function show($scheduleId)
    {
        // Get the earliest start_time and latest completed_at for the schedule
        $summary = RouteDetails::where('schedule_id', $scheduleId)
            ->selectRaw('
                MIN(start_time) as first_start_time,
                MAX(completed_at) as last_completed_at
            ')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'first_start_time' => $summary->first_start_time,
                'last_completed_at' => $summary->last_completed_at,
            ]
        ]);
    }

}
