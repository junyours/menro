<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Truck;
use App\Models\RoutePlan;
use App\Models\ReSchedule;
use App\Models\RouteDetails;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\ReschedDetails;
use Illuminate\Support\Facades\Auth;

class ReScheduleController extends Controller
{
  public function missed()
{
    $missedLegs = RouteDetails::with([
        'schedule.truck',
        'schedule.driver.user',
        'schedule.barangay',
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal'
    ])
        ->where('status', 'missed')
        ->where('is_viewed', false) // ✅ Only show missed segments that are not yet viewed
        ->orderByRaw("FIELD(status, 'missed')")
        ->orderBy('completed_at', 'desc')
        ->get();

    if ($missedLegs->isEmpty()) {
        return Inertia::render('MissedSegments', [
            'missed_segments' => [],
            'trucks'          => Truck::select('id', 'plate_number')->get(),
            'drivers'         => DriverProfile::with('user')->get()->map(function ($driver) {
                return [
                    'id'       => $driver->id,
                    'name'     => $driver->user->name,
                    'truck_id' => $driver->assigned_truck_id,
                ];
            }),
        ]);
    }

    $formatted = $missedLegs->map(function ($leg) {
        // ✅ Build proper leg names
        $fromName = trim(
            ($leg->fromZone?->id ? "{$leg->fromZone->name}" : "")
            . ($leg->fromTerminal?->name ? ": {$leg->fromTerminal->name}" : "")
        ) ?: "Unknown";

        $toName = trim(
            ($leg->toZone?->id ? "{$leg->toZone->name}" : "")
            . ($leg->toTerminal?->name ? ": {$leg->toTerminal->name}" : "")
        ) ?: "Unknown";

        return [
            'id'           => $leg->id,
            'status'       => $leg->status,
            'completed_at' => $leg->completed_at,
            'remarks'      => $leg->remarks,
            'is_viewed'    => $leg->is_viewed, // ✅ Include is_viewed in the data

            // ✅ Schedule relations
            'schedule'     => $leg->schedule,

            // ✅ Proper formatted labels
            'from_name'    => $fromName,
            'to_name'      => $toName,

            // ✅ Optional type indicators
            'from_type'    => $leg->fromZone ? 'zone' : 'terminal',
            'to_type'      => $leg->toZone ? 'zone' : 'terminal',
        ];
    });

    // ✅ Get only active trucks
    $trucks = Truck::select('id', 'plate_number')
        ->where('status', 'active')
        ->get();

    // ✅ Get only active drivers
    $drivers = DriverProfile::with('user')
        ->where('is_active', true)
        ->get()
        ->map(function ($driver) {
            return [
                'id'       => $driver->id,
                'name'     => $driver->user->name,
                'truck_id' => $driver->assigned_truck_id,
            ];
        });

    return Inertia::render('MissedSegments', [
        'missed_segments' => $formatted,
        'trucks'          => $trucks,
        'drivers'         => $drivers,
    ]);
}


public function markAsViewed($id)
{
    $leg = RouteDetails::find($id);

    if (!$leg) {
        return response()->json(['success' => false, 'message' => 'Segment not found'], 404);
    }

    $leg->is_viewed = true;
    $leg->save();

    return response()->json([
        'success' => true,
        'message' => 'Segment marked as viewed',
    ]);
}


public function reschedule(Request $request)
{
    $request->validate([
        'leg_ids'         => 'required|array|min:1',
        'leg_ids.*'       => 'exists:route_details,id',
        'reschedule_time' => 'required|date',
        'truck_id'        => 'required|exists:trucks,id',
        'driver_id'       => 'required|exists:driver_profiles,id',
    ]);

    $validLegs = RouteDetails::with('schedule')
        ->whereIn('id', $request->leg_ids)
        ->where('status', 'missed')
        ->get();

    if ($validLegs->isEmpty()) {
        return back()->withErrors(['error' => 'No eligible "missed" segments were found.']);
    }

    // Use the first leg's schedule to derive barangay_id
    $firstSchedule = $validLegs->first()->schedule;

    // Create ONE ReSchedule entry for all legs (without schedule_id)
    $newSchedule = ReSchedule::create([
        'truck_id'        => $request->truck_id,
        'driver_id'       => $request->driver_id,
        'barangay_id'     => $firstSchedule->barangay_id,
        'pickup_datetime' => Carbon::parse($request->reschedule_time),
        'status'          => 'pending',
        'remarks'         => 'Bulk rescheduled from segments: ' . implode(', ', $validLegs->pluck('id')->toArray()),
    ]);

    $rescheduledCount = 0;

    foreach ($validLegs as $leg) {
        // Create ReschedDetails for each leg with schedule_id (old schedule id) included
        ReschedDetails::create([
            'reschedule_id'    => $newSchedule->id,
            'schedule_id'      => $leg->schedule_id,  // store old schedule_id here
            'from_zone_id'     => $leg->from_zone_id,
            'from_terminal_id' => $leg->from_terminal_id,
            'to_zone_id'       => $leg->to_zone_id,
            'to_terminal_id'   => $leg->to_terminal_id,
            'distance_km'      => $leg->distance_km,
            'distance_m'       => $leg->distance_m,
            'duration_min'     => $leg->duration_min,
            'speed_kmh'        => $leg->speed_kmh,
            'status'           => 'pending',
            'start_time'       => Carbon::parse($request->reschedule_time),
            'completed_at'     => null,
        ]);

        // Update leg status to rescheduled
        $leg->update(['status' => 'rescheduled']);

        $rescheduledCount++;
    }

    $skipped = array_diff($request->leg_ids, $validLegs->pluck('id')->toArray());

    $message = "✅ Successfully rescheduled {$rescheduledCount} segment" . ($rescheduledCount > 1 ? 's' : '') . " with ReSchedule ID #{$newSchedule->id}.";

    if (!empty($skipped)) {
        $message .= " Skipped " . count($skipped) . ": " . implode(', ', $skipped) . ".";
    }

    return redirect()->back()->with('success', $message);
}


public function retrieveSelected(Request $request)
{
    $request->validate([
        'leg_ids' => 'required|array|min:1',
        'leg_ids.*' => 'exists:route_details,id',
    ]);

    $driver = Auth::user()->driverProfile; // ✅ logged-in driver's profile
    if (!$driver) {
        return response()->json(['error' => 'Driver profile not found.'], 403);
    }

    // ✅ Get the truck automatically from driver profile
    $truckId = $driver->assigned_truck_id;
    if (!$truckId) {
        return response()->json([
            'error' => "You don't have an assigned truck. Please contact your administrator."
        ], 400);
    }

    // Fetch missed legs
    $validLegs = RouteDetails::with('schedule')
        ->whereIn('id', $request->leg_ids)
        ->where('status', 'missed')
        ->get();

    if ($validLegs->isEmpty()) {
        return response()->json(['error' => 'No eligible missed segments found.'], 404);
    }

    // Barangay comes from the first schedule
    $firstSchedule = $validLegs->first()->schedule;

    // ✅ Create a new ReSchedule entry
    $newSchedule = ReSchedule::create([
        'truck_id'        => $truckId,
        'driver_id'       => $driver->id,
        'barangay_id'     => $firstSchedule->barangay_id,
        'pickup_datetime' => now(),
        'status'          => 'pending',
        'remarks'         => 'Retrieved missed segments: ' . implode(', ', $validLegs->pluck('id')->toArray()),
    ]);

    // ✅ Attach each missed leg as a new reschedule detail
    foreach ($validLegs as $leg) {
        ReschedDetails::create([
            'reschedule_id'    => $newSchedule->id,
            'schedule_id'      => $leg->schedule_id,
            'from_zone_id'     => $leg->from_zone_id,
            'from_terminal_id' => $leg->from_terminal_id,
            'to_zone_id'       => $leg->to_zone_id,
            'to_terminal_id'   => $leg->to_terminal_id,
            'distance_km'      => $leg->distance_km,
            'distance_m'       => $leg->distance_m,
            'duration_min'     => $leg->duration_min,
            'speed_kmh'        => $leg->speed_kmh,
            'status'           => 'pending',
            'start_time'       => now(),
            'completed_at'     => null,
        ]);

        // Mark old leg as rescheduled
        $leg->update(['status' => 'rescheduled']);
    }

    return response()->json([
        'success' => true,
        'message' => "Retrieved " . count($validLegs) . " missed segment(s) successfully.",
        'new_schedule_id' => $newSchedule->id,
        'truck_id' => $truckId, // ✅ Optional: return for confirmation
    ]);
}




public function index()
{
    $user = auth()->user();

    // find the driver profile linked to this user
    $driver = $user->driverProfile;

    if (!$driver) {
        return response()->json(['message' => 'No driver profile found'], 404);
    }

    // Fetch only Pending reschedules for this driver
    $reschedules = ReSchedule::with([
        'truck',
        'driver.user',
        'barangay',
        'details.fromZone',
        'details.toZone',
    ])
    ->where('driver_id', $driver->id)
    ->where('status', 'pending')
    ->get();

    // ✅ Count pending reschedules
    $pendingCount = ReSchedule::where('driver_id', $driver->id)
        ->where('status', 'pending')
        ->count();

    return response()->json([
        'reschedules' => $reschedules,
        'pendingCount' => $pendingCount, // ✅ Added count here
    ]);
}




public function showByReschedule($rescheduleId)
{
    $details = ReschedDetails::with([
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal',
    ])
    ->where('reschedule_id', $rescheduleId)
    ->get();

    if ($details->isEmpty()) {
        return response()->json([
            'message' => 'No reschedule details found for this schedule',
            'rescheduleDetails' => []
        ], 200);
    }

    $formatted = $details->map(function ($detail) {
        return [
            'id'              => $detail->id,
            'status'          => $detail->status,
            'distance_km'     => $detail->distance_km,
            'duration_min'    => $detail->duration_min,
            'speed_kmh'       => $detail->speed_kmh,
            'reschedule_id'   => $detail->reschedule_id,
            'from_zone_id'    => $detail->fromZone?->id,
            'from_terminal_id'=> $detail->fromTerminal?->id,
            'to_zone_id'      => $detail->toZone?->id,
            'to_terminal_id'  => $detail->toTerminal?->id,
            'start_time'      => $detail->start_time,
            'completed_at'    => $detail->completed_at,
            'created_at'      => $detail->created_at,
            'updated_at'      => $detail->updated_at,

            // ✅ Labels for UI
            'from_label' => ($detail->fromZone ? "{$detail->fromZone->name}" : "")
                         . ($detail->fromTerminal ? ": {$detail->fromTerminal->name}" : ""),
            'to_label'   => ($detail->toZone ? "{$detail->toZone->name}" : "")
                         . ($detail->toTerminal ? ": {$detail->toTerminal->name}" : ""),

            // ✅ Still keep lat/lng for logs
            'from_lat'   => $detail->fromTerminal?->lat
                            ?? optional($detail->fromZone->route_path)[0]['lat'] ?? null,
            'from_lng'   => $detail->fromTerminal?->lng
                            ?? optional($detail->fromZone->route_path)[0]['lng'] ?? null,
            'to_lat'     => $detail->toTerminal?->lat
                            ?? optional($detail->toZone->route_path)[0]['lat'] ?? null,
            'to_lng'     => $detail->toTerminal?->lng
                            ?? optional($detail->toZone->route_path)[0]['lng'] ?? null,
        ];
    });

    return response()->json([
        'rescheduleDetails' => $formatted
    ], 200);
}

public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status'       => 'nullable|in:pending,completed,missed',
        'start_time'   => 'nullable|string',
        'completed_at' => 'nullable|string',
    ]);

    $leg = ReschedDetails::findOrFail($id);

    $appTimezone = config('app.timezone', 'Asia/Manila');

    if ($request->filled('start_time')) {
        $leg->start_time = Carbon::parse($request->start_time)
            ->setTimezone($appTimezone);
    }

    if ($request->filled('completed_at')) {
        $leg->completed_at = Carbon::parse($request->completed_at)
            ->setTimezone($appTimezone);
    }

    if ($request->filled('status')) {
        $leg->status = $request->status;

        if (in_array($request->status, ['completed', 'missed']) && !$leg->completed_at) {
            $leg->completed_at = now(); 
        }
    }

    $leg->save();

    return response()->json([
        'success' => true,
        'message' => 'Segment updated successfully',
        'leg'     => $leg,
    ]);
}



public function complete($id)
{
  
    $schedule = ReSchedule::findOrFail($id);

    $schedule->status = 'completed';
    $schedule->completed_at = Carbon::now(); 
    $schedule->save();

    return response()->json([
        'message' => 'Schedule marked as completed successfully',
        'schedule' => $schedule,
    ], 200);
}

}
