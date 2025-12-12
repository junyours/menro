<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use Inertia\Inertia;
use App\Models\Truck;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\BarangayProfile;
use App\Models\GarbageSchedule;
use Illuminate\Support\Facades\Validator;


class GarbageScheduleController extends Controller
{
  public function index()
{
   $trucks = Truck::with('drivers')
    ->where('status', 'Active')
    ->get();
    $barangays = BarangayProfile::all();

  $schedules = GarbageSchedule::with(['truck', 'driver.user', 'barangay'])
    ->whereNotIn('status', ['Deleted', 'Completed'])
    ->orderBy('pickup_datetime', 'desc') // latest first
    ->get();

    return Inertia::render('schedule/CreateSchedule', [
        'trucks' => $trucks,
        'truckDriverMap' => $trucks->mapWithKeys(function ($truck) {
            return [$truck->id => $truck->drivers];
        }),
        'barangays' => $barangays,
        'schedules' => $schedules,
    ]);
}

public function store(Request $request)
{
    $validated = $request->validate([
        'truck_id' => 'required|exists:trucks,id',
        'driver_id' => 'required|exists:driver_profiles,id',
        'barangay_id' => 'required|exists:barangay_profiles,id',
        'pickup_datetime' => 'required|date',
        'remarks' => 'nullable|string',
    ]);

    // Prevent duplicate
    $exists = GarbageSchedule::where('truck_id', $validated['truck_id'])
        ->where('pickup_datetime', $validated['pickup_datetime'])
        ->exists();

    if ($exists) {
        if ($request->expectsJson()) {
            return response()->json(['error' => 'Duplicate schedule detected.'], 422);
        }
        return back()->withErrors(['duplicate' => 'This truck already has a schedule at that date and time.']);
    }

    $validated['status'] = 'Pending';
    $schedule = GarbageSchedule::create($validated);
    $schedule->load(['truck', 'driver.user', 'barangay']);

    if ($request->expectsJson()) {
        return response()->json([
            'success' => true,
            'message' => 'Schedule created successfully!',
            'newSchedule' => $schedule,
        ]);
    }

    // Default Inertia redirect
    return redirect()->back()->with([
        'success' => 'Garbage Schedule created.',
        'newSchedule' => $schedule,
    ]);
}


 // Optional: Get driver by truck
public function getDriverByTruck($truckId)
{
    $drivers = DriverProfile::with('user')
        ->where('assigned_truck_id', $truckId)
        ->where('is_active', true) // ✅ Only active drivers
        ->get()
        ->map(function ($driver) {
            return [
                'id' => $driver->id,
                'name' => $driver->user->name,
            ];
        });

    return response()->json($drivers);
}

public function complete($id)
{
    $schedule = GarbageSchedule::findOrFail($id);

    // ✅ Update status and completion timestamp
    $schedule->update([
        'status' => 'completed',
        'completed_at' => Carbon::now(),
    ]);

    return response()->json([
        'message' => 'Schedule marked as completed successfully',
        'schedule' => $schedule,
    ], 200);
}


public function show($id)
    {
        // Find the schedule with related truck, driver, and route details
        $schedule = GarbageSchedule::with([
            'truck',
            'driver.user',
            'route_details' // relationship from schedule -> route_details
        ])->find($id);

        if (!$schedule) {
            return response()->json([
                'message' => 'Schedule not found'
            ], 404);
        }

        return response()->json($schedule);
    }


 public function start(Request $request, $id)
{
    try {
        // Find the schedule record
        $schedule = GarbageSchedule::find($id);

        if (!$schedule) {
            return response()->json(['error' => "Schedule with ID {$id} not found."], 404);
        }

        // Parse both times using the same timezone
        $pickup = Carbon::parse($schedule->pickup_datetime, 'Asia/Manila');
        $now = Carbon::now('Asia/Manila');

        // Calculate the delay in seconds (negative = started early)
        $delaySeconds = $pickup->diffInSeconds($now, false);

        // Human-friendly delay formatting function
        $formatDelay = function ($seconds) {
            $seconds = abs($seconds);

            if ($seconds < 60) {
                return "{$seconds} second" . ($seconds != 1 ? 's' : '');
            } elseif ($seconds < 3600) {
                $minutes = floor($seconds / 60);
                return "{$minutes} minute" . ($minutes != 1 ? 's' : '');
            } elseif ($seconds < 86400) {
                $hours = floor($seconds / 3600);
                return "{$hours} hour" . ($hours != 1 ? 's' : '');
            } elseif ($seconds < 604800) {
                $days = floor($seconds / 86400);
                return "{$days} day" . ($days != 1 ? 's' : '');
            } elseif ($seconds < 2592000) {
                $weeks = floor($seconds / 604800);
                return "{$weeks} week" . ($weeks != 1 ? 's' : '');
            } elseif ($seconds < 31536000) {
                $months = floor($seconds / 2592000);
                return "{$months} month" . ($months != 1 ? 's' : '');
            } else {
                $years = floor($seconds / 31536000);
                return "{$years} year" . ($years != 1 ? 's' : '');
            }
        };

        // Determine status message
        if ($delaySeconds > 0) {
            $status = "Delayed by " . $formatDelay($delaySeconds);
        } elseif ($delaySeconds < 0) {
            $status = "Started early by " . $formatDelay($delaySeconds);
        } else {
            $status = "On Time";
        }

        // Format readable timestamp
        $formattedNow = $now->format('F j, Y, g:i A');

        // Update remarks
        $schedule->remarks = "This schedule started at {$formattedNow} — {$status}.";
        $schedule->save();

        return response()->json([
            'message' => '✅ Schedule started successfully.',
            'data' => $schedule,
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
        ], 500);
    }
}



public function updateStatus(Request $request, $id)
{
    // Validate incoming status
    $request->validate([
        'status' => 'required|string|in:Deleted',
    ]);

    $schedule = GarbageSchedule::findOrFail($id);
    $schedule->status = $request->status;
    $schedule->save();

    return response()->json([
        'success' => true,
        'message' => "Schedule status updated to {$request->status}",
        'schedule' => $schedule
    ]);
}


public function update(Request $request, $id)
{
    $schedule = GarbageSchedule::find($id);

    if (!$schedule) {
        return response()->json([
            'success' => false,
            'message' => 'Schedule not found',
        ], 404);
    }

    // ✅ Validation (same as store)
    $validator = Validator::make($request->all(), [
        'truck_id'        => 'required|exists:trucks,id',
        'driver_id'       => 'required|exists:driver_profiles,id',
        'barangay_id'     => 'required|exists:barangay_profiles,id', // FIXED
        'pickup_datetime' => 'required|date',
        'remarks'         => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors'  => $validator->errors()
        ], 422);
    }

    // 🔍 Prevent duplicate conflicting schedule (same logic as store)
    $exists = GarbageSchedule::where('truck_id', $request->truck_id)
        ->where('pickup_datetime', $request->pickup_datetime)
        ->where('id', '!=', $id)   // exclude current schedule
        ->exists();

    if ($exists) {
        return response()->json([
            'success' => false,
            'error' => 'Duplicate schedule detected for this truck at the same date and time.'
        ], 422);
    }

    // ✅ Update schedule
    $schedule->truck_id        = $request->truck_id;
    $schedule->driver_id       = $request->driver_id;
    $schedule->barangay_id     = $request->barangay_id;
    $schedule->pickup_datetime = $request->pickup_datetime;
    $schedule->remarks         = $request->remarks ?? $schedule->remarks;

    $schedule->save();

    $schedule->load(['truck', 'driver.user', 'barangay']);

    return response()->json([
        'success'  => true,
        'message'  => 'Schedule updated successfully.',
        'schedule' => $schedule,
    ]);
}
}

