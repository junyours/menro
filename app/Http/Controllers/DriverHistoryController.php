<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GarbageSchedule;
use App\Models\RouteDetails;
use App\Models\ReSchedule;
use App\Models\ReschedDetails;

class DriverHistoryController extends Controller
{

public function getHistory(Request $request)
{
    $user = auth()->user();

    if (!$user) {
        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    $driver = $user->driverProfile;  

    if (!$driver) {
        return response()->json(['error' => 'No driver profile found'], 404);
    }

    $driverId = $driver->id;

    $schedules = GarbageSchedule::where('driver_id', $driverId)
        ->where('status', 'completed')
        ->with(['barangay:id,name'])
        ->orderBy('pickup_datetime', 'desc')
        ->get();

    $reschedules = ReSchedule::where('driver_id', $driverId)
        ->where('status', 'completed')
        ->with(['barangay:id,name'])
        ->orderBy('pickup_datetime', 'desc')
        ->get();

    return response()->json([
        'schedules'   => $schedules,
        'reschedules' => $reschedules,
    ]);
}

   public function getScheduleDetails(Request $request)
{
    $scheduleId = $request->schedule_id;

    $details = RouteDetails::where('schedule_id', $scheduleId)
        ->with([
            'fromZone:id,name',
            'toZone:id,name',
            'fromTerminal:id,name',
            'toTerminal:id,name',
            'wasteCollections'
        ])
        ->get();

    return response()->json($details);
}


    public function getRescheduleDetails(Request $request)
{
    $rescheduleId = $request->reschedule_id;

    $details = ReschedDetails::where('reschedule_id', $rescheduleId)
        ->with([
            'fromZone:id,name',
            'toZone:id,name',
            'fromTerminal:id,name',
            'toTerminal:id,name'
        ])
        ->get();

    return response()->json($details);
}

}
