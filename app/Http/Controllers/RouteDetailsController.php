<?php

namespace App\Http\Controllers;

use App\Models\RouteDetails;
use Illuminate\Http\Request;
use App\Models\RoutePlan;
use App\Models\Zone;
use App\Models\GarbageSchedule;
use Carbon\Carbon;



class RouteDetailsController extends Controller
{
     public function store(Request $request)
{
    $data = $request->validate([
        'schedule_id'     => 'required|exists:garbage_schedules,id', 
        'from_zone_id'    => 'nullable|exists:zones,id',
        'from_terminal_id'=> 'nullable|exists:garbage_terminals,id',
        'to_zone_id'      => 'nullable|exists:zones,id',
        'to_terminal_id'  => 'nullable|exists:garbage_terminals,id',
        'distance_km'     => 'nullable|numeric',
        'distance_m'      => 'nullable|numeric',
        'duration_min'    => 'nullable|numeric',
        'speed_kmh'       => 'nullable|numeric',
    ]);

    $data['status'] = 'pending';

    $leg = RouteDetails::create($data);

    return response()->json([
        'message' => 'Route leg created successfully.',
        'data' => $leg->load(['fromZone', 'toZone', 'fromTerminal', 'toTerminal']) // ✅ eager load
    ], 201);
}

    /**
     * Get all legs for a given route plan (for driver view).
     */
    public function index($routePlanId)
    {
        $legs = RouteDetails::where('route_plan_id', $routePlanId)->get();

        return response()->json($legs);
    }

    /**
     * Show a single leg detail
     */
    public function show($id)
    {
        $leg = RouteDetails::findOrFail($id);
        return response()->json($leg);
    }


public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status'       => 'nullable|in:pending,completed,missed',
        'start_time'   => 'nullable|string',
        'completed_at' => 'nullable|string',
        'remarks'      => 'nullable|string|max:255',
    ]);

    $leg = RouteDetails::findOrFail($id);

    // --- Handle start time ---
    if ($request->filled('start_time')) {
        $leg->start_time = Carbon::parse($request->start_time)
            ->setTimezone('Asia/Manila');
    }

    // --- Handle completed time ---
    if ($request->filled('completed_at')) {
        $leg->completed_at = Carbon::parse($request->completed_at)
            ->setTimezone('Asia/Manila');
    }

    // --- Handle status logic ---
    if ($request->filled('status')) {
        $leg->status = $request->status;

        // If completed or missed but completed_at is empty, set now()
        if (in_array($request->status, ['completed', 'missed']) && !$leg->completed_at) {
            $leg->completed_at = now();
        }

        // ✅ Automatically set remarks for completed
        if ($request->status === 'completed') {
            $leg->remarks = 'Already done';
        }

        // ✅ Allow driver to input reason only when missed
        if ($request->status === 'missed') {
            if ($request->filled('remarks')) {
                $leg->remarks = $request->remarks;
            } else {
                // Optional: enforce remarks for missed status
                return response()->json([
                    'success' => false,
                    'message' => 'Please provide a reason for missed status.',
                ], 422);
            }
        }
    }

    $leg->save();

    return response()->json([
        'success' => true,
        'message' => 'Segment updated successfully',
        'leg'     => $leg,
    ]);
}

    public function markAsCompleted($id)
{
    $schedule = GarbageSchedule::findOrFail($id);
    $schedule->status = 'completed';
    $schedule->save();

    return response()->json([
        'success' => true,
        'message' => 'Garbage Schedule marked as completed',
        'schedule' => $schedule
    ]);
}


public function showByRoutePlan($routePlanId)
{
    $details = RouteDetails::with([
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal',
        'schedule.barangay',
    ])
    ->where('schedule_id', $routePlanId)
    ->get();

    if ($details->isEmpty()) {
        return response()->json([
            'message' => 'No unfinished route details found for this route schedule',
            'routeDetails' => []
        ], 200);
    }

    $formatted = $details->map(function ($detail) {
        return [
            'id'           => $detail->id,
            'status'       => $detail->status,
            'distance_km'  => $detail->distance_km,
            'duration_min' => $detail->duration_min,
            'speed_kmh'    => $detail->speed_kmh,

            // NEW: expose raw IDs so mobile app can use them
            'from_zone_id'     => $detail->from_zone_id,
            'from_terminal_id' => $detail->from_terminal_id,
            'to_zone_id'       => $detail->to_zone_id,
            'to_terminal_id'   => $detail->to_terminal_id,

            'from_name' => trim(
                ($detail->fromZone?->name ? "{$detail->fromZone->name}" : "")
                . ($detail->fromTerminal?->name ? ": {$detail->fromTerminal->name}" : "")
            ) ?: "Unknown",

            'to_name' => trim(
                ($detail->toZone?->name ? "{$detail->toZone->name}" : "")
                . ($detail->toTerminal?->name ? ": {$detail->toTerminal->name}" : "")
            ) ?: "Unknown",

            'from_lat' => $detail->fromTerminal?->lat
                ?? optional($detail->fromZone->route_path)[0]['lat']
                ?? null,
            'from_lng' => $detail->fromTerminal?->lng
                ?? optional($detail->fromZone->route_path)[0]['lng']
                ?? null,
            'to_lat' => $detail->toTerminal?->lat
                ?? optional($detail->toZone->route_path)[0]['lat']
                ?? null,
            'to_lng' => $detail->toTerminal?->lng
                ?? optional($detail->toZone->route_path)[0]['lng']
                ?? null,

            'schedule' => [
                'pickup_datetime' => $detail->schedule?->pickup_datetime,
                'barangay' => [
                    'id'   => $detail->schedule?->barangay?->id,
                    'name' => $detail->schedule?->barangay?->name ?? 'Unknown',
                ],
            ],
        ];
    });

    return response()->json([
        'routeDetails' => $formatted
    ], 200);
}
}