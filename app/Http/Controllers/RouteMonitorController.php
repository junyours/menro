<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\ReSchedule;
use App\Models\RouteDetails;
use App\Models\ReschedDetails;
use App\Models\GarbageSchedule;
use Illuminate\Support\Facades\Auth;


class RouteMonitorController extends Controller
{
    /**
     * Show the route monitor page.
     */
    public function index()
    {
       $sched = GarbageSchedule::with([
        'truck',
        'barangay',
    ])
    ->where('status', 'pending') 
    ->get();

        return Inertia::render('Map', [
            'schedules' => $sched, 
        ]);
    }

  public function show()
{
    $sched = GarbageSchedule::with([
        'truck',
        'barangay',
    ])
    ->where('status', 'pending') // ✅ only pending schedules
    ->get();

    return Inertia::render('adminMap', [
        'schedules' => $sched, // frontend expects plural
    ]);
}


public function showHistory()
{
    $sched = GarbageSchedule::with([
        'truck',
        'barangay',
        'driver.user',
    ])
    ->orderBy('pickup_datetime', 'desc')
    ->get();

    // Load reschedule details and their linked reschedule + driver
    $reschedDetails = ReschedDetails::with([
        'fromZone:id,name',
        'toZone:id,name',
        'fromTerminal:id,name',
        'toTerminal:id,name',
        'reschedule.driver.user',
    ])->orderBy('created_at', 'desc')->get();

    return Inertia::render('History', [
        'schedules'      => $sched,
        'reschedDetails' => $reschedDetails,
    ]);
}

     public function ResHistory()
    {
        $sched = GarbageSchedule::with([
            'truck',
            'barangay',
        ])->get();

        return Inertia::render('ResHistory', [
            'schedules' => $sched, // ✅ frontend expects plural
        ]);
    }

  public function BarHistory()
{
    $user = Auth::user();

    // Get the barangay profile for this user
    $barangayProfile = $user->barangayProfile;

    if (!$barangayProfile) {
        // No barangay profile found, return empty schedules
        return Inertia::render('BarHistory', [
            'schedules' => collect(),
        ]);
    }

    // Fetch schedules only for this barangay
    $sched = GarbageSchedule::with(['truck', 'barangay'])
        ->where('barangay_id', $barangayProfile->id)
        ->orderBy('pickup_datetime', 'desc')
        ->get();

    return Inertia::render('BarHistory', [
        'schedules' => $sched,
    ]);
}

    public function BarReSched()
{
    $user = Auth::user();

    // Get the barangay profile for this user
    $barangayProfile = $user->barangayProfile;

    if (!$barangayProfile) {
        // No barangay profile found, return empty reschedules
        return Inertia::render('BarReschedule', [
            'reschedules' => collect(),
        ]);
    }

    // Fetch reschedules only for this barangay
    $sched = ReSchedule::with(['truck', 'barangay'])
        ->where('barangay_id', $barangayProfile->id)
        ->orderBy('pickup_datetime', 'desc')
        ->get();

    return Inertia::render('BarReschedule', [
        'reschedules' => $sched, // frontend expects plural
    ]);
}


    
    public function AdminReSched()
{
    $sched = ReSchedule::with([
        'truck',
        'barangay',
        'driver.user', 
    ])->orderBy('pickup_datetime', 'desc')  // 👈 Sort by latest first
    ->get();

    return Inertia::render('AdminReschedules', [
        'reschedules' => $sched, 
    ]);
}

     public function routeSummary($scheduleId)
    {
        $schedule = GarbageSchedule::with('routeSummary')->findOrFail($scheduleId);

        return response()->json([
            'summary' => $schedule->routeSummary,
        ]);
    }

    /**
     * API: Return the route details (segments) for a schedule.
     */
 public function details($scheduleId)
{
    $schedule = GarbageSchedule::with([
        'driver',          // 👈 Load assigned driver
        'driver.user'      // 👈 If driver connects to User table
    ])->find($scheduleId);

    if (!$schedule) {
        return response()->json([
            'message' => 'Schedule not found',
            'routeDetails' => []
        ], 404);
    }

    // --- Fetch Only Original Route Details ---
    $details = RouteDetails::with([
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal'
    ])
    ->where('schedule_id', $scheduleId)
    ->get();

    if ($details->isEmpty()) {
        return response()->json([
            'message' => 'No route details found for this schedule',
            'driver' => $schedule->driver ?? null,
            'routeDetails' => []
        ], 200);
    }

    // --- Format Original Details Only ---
    $formatted = $details->map(function ($detail) {
        $actualDuration = null;
        $statusRemark   = null;

        if ($detail->start_time && $detail->completed_at) {
            $start = \Carbon\Carbon::parse($detail->start_time);
            $end   = \Carbon\Carbon::parse($detail->completed_at);

            $actualDuration = $start->diffInMinutes($end);
            $statusRemark   = $actualDuration <= $detail->duration_min
                ? 'on_time'
                : 'delayed';
        }

        $fromName = trim(
            ($detail->fromZone?->name ? "{$detail->fromZone->name}" : "")
            . ($detail->fromTerminal?->name ? ": {$detail->fromTerminal->name}" : "")
        ) ?: "Unknown";

        $toName = trim(
            ($detail->toZone?->name ? "{$detail->toZone->name}" : "")
            . ($detail->toTerminal?->name ? ": {$detail->toTerminal->name}" : "")
        ) ?: "Unknown";

        return [
            'id'             => $detail->id,
            'status'         => $detail->status,
            'distance_km'    => $detail->distance_km,
            'duration_min'   => $detail->duration_min,
            'speed_kmh'      => $detail->speed_kmh,
            'start_time'     => $detail->start_time,
            'completed_at'   => $detail->completed_at,
            'actual_minutes' => $actualDuration,
            'time_status'    => $statusRemark,
            'from_name'      => $fromName,
            'to_name'        => $toName,
            'from_type'      => $detail->fromZone ? 'zone' : 'terminal',
            'to_type'        => $detail->toZone ? 'zone' : 'terminal',
            'from_lat'       => $detail->fromTerminal?->lat
                                ?? ($detail->fromZone->route_path[0]['lat'] ?? null),
            'from_lng'       => $detail->fromTerminal?->lng
                                ?? ($detail->fromZone->route_path[0]['lng'] ?? null),
            'to_lat'         => $detail->toTerminal?->lat
                                ?? ($detail->toZone->route_path[0]['lat'] ?? null),
            'to_lng'         => $detail->toTerminal?->lng
                                ?? ($detail->toZone->route_path[0]['lng'] ?? null),
            'reschedule_id'  => null,
            'reschedule_pickup_datetime' => null
        ];
    });

    // --- Include driver details in final response ---
    return response()->json([
        'driver' => $schedule->driver ? [
            'id'    => $schedule->driver->id,
            'name'  => $schedule->driver->user->name ?? 'Unknown',
            'email' => $schedule->driver->user->email ?? null,
        ] : null,

        'routeDetails' => $formatted
    ], 200);
}



 public function redetails($scheduleId)
{
    $details = ReschedDetails::with([
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal'
    ])
    ->where('reschedule_id', $scheduleId)
    ->get();

    if ($details->isEmpty()) {
        return response()->json([
            'message' => 'No route details found for this schedule',
            'routeDetails' => []
        ], 200);
    }

    $formatted = $details->map(function ($detail) {
        $actualDuration = null;
        $statusRemark   = null;

        if ($detail->start_time && $detail->completed_at) {
            $start = \Carbon\Carbon::parse($detail->start_time);
            $end   = \Carbon\Carbon::parse($detail->completed_at);

            $actualDuration = $start->diffInMinutes($end);

            $statusRemark = $actualDuration <= $detail->duration_min
                ? 'on_time'
                : 'delayed';
        }

        $fromName = $detail->fromZone?->name
            ? $detail->fromZone->name . ($detail->fromTerminal?->name ? ": {$detail->fromTerminal->name}" : "")
            : ($detail->fromTerminal?->name ?? "Unknown");

        $toName = $detail->toZone?->name
            ? $detail->toZone->name . ($detail->toTerminal?->name ? ": {$detail->toTerminal->name}" : "")
            : ($detail->toTerminal?->name ?? "Unknown");

        // ✅ Safe lat/lng extraction
        $fromLat = $detail->fromTerminal?->lat
            ?? ($detail->fromZone && is_array($detail->fromZone->route_path) && isset($detail->fromZone->route_path[0]['lat'])
                ? $detail->fromZone->route_path[0]['lat'] : null);

        $fromLng = $detail->fromTerminal?->lng
            ?? ($detail->fromZone && is_array($detail->fromZone->route_path) && isset($detail->fromZone->route_path[0]['lng'])
                ? $detail->fromZone->route_path[0]['lng'] : null);

        $toLat = $detail->toTerminal?->lat
            ?? ($detail->toZone && is_array($detail->toZone->route_path) && isset($detail->toZone->route_path[0]['lat'])
                ? $detail->toZone->route_path[0]['lat'] : null);

        $toLng = $detail->toTerminal?->lng
            ?? ($detail->toZone && is_array($detail->toZone->route_path) && isset($detail->toZone->route_path[0]['lng'])
                ? $detail->toZone->route_path[0]['lng'] : null);

        return [
            'id'             => $detail->id,
            'status'         => $detail->status,
            'distance_km'    => $detail->distance_km,
            'duration_min'   => $detail->duration_min,
            'speed_kmh'      => $detail->speed_kmh,
            'start_time'     => $detail->start_time,
            'completed_at'   => $detail->completed_at,
            'actual_minutes' => $actualDuration,
            'time_status'    => $statusRemark,
            'from_name'      => $fromName,
            'to_name'        => $toName,
            'from_type'      => $detail->fromZone ? 'zone' : 'terminal',
            'to_type'        => $detail->toZone ? 'zone' : 'terminal',
            'from_lat'       => $fromLat,
            'from_lng'       => $fromLng,
            'to_lat'         => $toLat,
            'to_lng'         => $toLng,
        ];
    });

    return response()->json([
        'routeDetails' => $formatted
    ], 200);
}



public function AdminRedetails($scheduleId)
{
    $details = ReschedDetails::with([
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal'
    ])
    ->where('reschedule_id', $scheduleId)
    ->get();

    if ($details->isEmpty()) {
        return response()->json([
            'message' => 'No route details found for this schedule',
            'routeDetails' => []
        ], 200);
    }

    $formatted = $details->map(function ($detail) {
        $actualDuration = null;
        $statusRemark   = null;

        if ($detail->start_time && $detail->completed_at) {
            $start = \Carbon\Carbon::parse($detail->start_time);
            $end   = \Carbon\Carbon::parse($detail->completed_at);

            $actualDuration = $start->diffInMinutes($end);

            $statusRemark = $actualDuration <= $detail->duration_min
                ? 'on_time'
                : 'delayed';
        }

        $fromName = $detail->fromZone?->name
            ? $detail->fromZone->name . ($detail->fromTerminal?->name ? ": {$detail->fromTerminal->name}" : "")
            : ($detail->fromTerminal?->name ?? "Unknown");

        $toName = $detail->toZone?->name
            ? $detail->toZone->name . ($detail->toTerminal?->name ? ": {$detail->toTerminal->name}" : "")
            : ($detail->toTerminal?->name ?? "Unknown");

        // ✅ Safe lat/lng extraction
        $fromLat = $detail->fromTerminal?->lat
            ?? ($detail->fromZone && is_array($detail->fromZone->route_path) && isset($detail->fromZone->route_path[0]['lat'])
                ? $detail->fromZone->route_path[0]['lat'] : null);

        $fromLng = $detail->fromTerminal?->lng
            ?? ($detail->fromZone && is_array($detail->fromZone->route_path) && isset($detail->fromZone->route_path[0]['lng'])
                ? $detail->fromZone->route_path[0]['lng'] : null);

        $toLat = $detail->toTerminal?->lat
            ?? ($detail->toZone && is_array($detail->toZone->route_path) && isset($detail->toZone->route_path[0]['lat'])
                ? $detail->toZone->route_path[0]['lat'] : null);

        $toLng = $detail->toTerminal?->lng
            ?? ($detail->toZone && is_array($detail->toZone->route_path) && isset($detail->toZone->route_path[0]['lng'])
                ? $detail->toZone->route_path[0]['lng'] : null);

        return [
            'id'             => $detail->id,
            'status'         => $detail->status,
            'distance_km'    => $detail->distance_km,
            'duration_min'   => $detail->duration_min,
            'speed_kmh'      => $detail->speed_kmh,
            'start_time'     => $detail->start_time,
            'completed_at'   => $detail->completed_at,
            'actual_minutes' => $actualDuration,
            'time_status'    => $statusRemark,
            'from_name'      => $fromName,
            'to_name'        => $toName,
            'from_type'      => $detail->fromZone ? 'zone' : 'terminal',
            'to_type'        => $detail->toZone ? 'zone' : 'terminal',
            'from_lat'       => $fromLat,
            'from_lng'       => $fromLng,
            'to_lat'         => $toLat,
            'to_lng'         => $toLng,
        ];
    });

    return response()->json([
        'routeDetails' => $formatted
    ], 200);
}


}