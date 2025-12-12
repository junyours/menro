<?php

namespace App\Http\Controllers;

use App\Models\RouteDetails;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\ReschedDetails;
use App\Models\GarbageSchedule;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class DriverPerformanceController extends Controller
{
public function getDriverStats(Request $request)
{
    $driverId = $request->input('driver_id');
    $scheduleId = $request->input('schedule_id'); // optional

    // Step 1: Convert user_id to driver_id if needed
    $driverProfile = DriverProfile::where('user_id', $driverId)->first();
    if ($driverProfile) {
        $driverId = $driverProfile->id;
    }

    $total = 0;
    $ontime = 0;
    $delayed = 0;
    $logs = [];
    $routeRecords = [];

    // Step 2: Regular routes
    $regularRoutes = RouteDetails::whereHas('schedule', function ($q) use ($driverId, $scheduleId) {
        $q->where('driver_id', $driverId);
        if ($scheduleId) $q->where('id', $scheduleId);
    })->get();

    foreach ($regularRoutes as $route) {
        if (!$route->start_time || !$route->completed_at) continue;

        $start = strtotime($route->start_time);
        $completed = strtotime($route->completed_at);
        $actualDuration = $completed - $start;
        $allowedDuration = $route->duration_min * 60;

        if ($actualDuration <= $allowedDuration) {
            $ontime++;
            $status = 'ontime';
        } else {
            $delayed++;
            $status = 'delayed';
        }

        $logs[] = "Route {$route->id}: actual={$actualDuration}s allowed={$allowedDuration}s status={$status}";

        $routeRecords[] = [
            'id' => $route->id,
            'type' => 'regular',
            'start_time' => $route->start_time,
            'completed_at' => $route->completed_at,
            'allowed' => $allowedDuration,
            'actual' => $actualDuration,
            'status' => $status,
        ];

        $total++;
    }

    // Step 3: Rescheduled routes
    $reschedRoutes = ReschedDetails::whereHas('reschedule', function ($q) use ($driverId, $scheduleId) {
        $q->where('driver_id', $driverId);
        if ($scheduleId) $q->where('schedule_id', $scheduleId);
    })->get();

    foreach ($reschedRoutes as $resched) {
        if (!$resched->start_time || !$resched->completed_at) continue;

        $start = strtotime($resched->start_time);
        $completed = strtotime($resched->completed_at);
        $actualDuration = $completed - $start;
        $allowedDuration = $resched->duration_min * 60;

        if ($actualDuration <= $allowedDuration) {
            $ontime++;
            $status = 'ontime';
        } else {
            $delayed++;
            $status = 'delayed';
        }

        $logs[] = "Resched {$resched->id}: actual={$actualDuration}s allowed={$allowedDuration}s status={$status}";

        $routeRecords[] = [
            'id' => $resched->id,
            'type' => 'reschedule',
            'start_time' => $resched->start_time,
            'completed_at' => $resched->completed_at,
            'allowed' => $allowedDuration,
            'actual' => $actualDuration,
            'status' => $status,
        ];

        $total++;
    }

    // Step 4: Return response
    return response()->json([
        'driver_id' => $driverId,
        'schedule_id' => $scheduleId,
        'total_routes' => $total,
        'ontime' => $ontime,
        'delayed' => $delayed,
        'logs' => $logs,
        'routes' => $routeRecords,
    ]);
}


/**
 * Optional: Get stats per schedule (if you only want schedule-based)
 */
public function getScheduleStats($scheduleId)
{
    $schedule = GarbageSchedule::findOrFail($scheduleId);
    $routes = $schedule->route_details;

    $total = $routes->count();
    $ontime = 0;
    $delayed = 0;

    foreach ($routes as $route) {
        if (!$route->start_time || !$route->completed_at) continue;

        $start = strtotime($route->start_time);
        $completed = strtotime($route->completed_at);
        $allowedDuration = $route->duration_min * 60;

        if (($completed - $start) <= $allowedDuration) {
            $ontime++;
        } else {
            $delayed++;
        }
    }

    return response()->json([
        'schedule_id' => $scheduleId,
        'driver_id' => $schedule->driver_id,
        'total_routes' => $total,
        'ontime' => $ontime,
        'delayed' => $delayed,
    ]);
}

public function leaderboard()
{
    $drivers = DriverProfile::with('user')->get()->map(function($driver) {
        $ontimeCount = 0;
        $delayedCount = 0;

        // 1️⃣ Regular RouteDetails
        $routeDetails = RouteDetails::whereHas('schedule', function($q) use ($driver) {
            $q->where('driver_id', $driver->id);
        })->get();

        foreach ($routeDetails as $route) {
            // make sure start_time and completed_at exist
            if (!isset($route->start_time) || !isset($route->completed_at)) continue;

            $start = strtotime($route->start_time);
            $completed = strtotime($route->completed_at);
            $allowedDuration = ($route->duration_min ?? 0) * 60;

            if (($completed - $start) <= $allowedDuration) {
                $ontimeCount++;
            } else {
                $delayedCount++;
            }
        }

        // 2️⃣ Rescheduled Routes
        $reschedDetails = ReschedDetails::whereHas('reschedule', function($q) use ($driver) {
            $q->where('driver_id', $driver->id);
        })->get();

        foreach ($reschedDetails as $resched) {
            if (!isset($resched->start_time) || !isset($resched->completed_at)) continue;

            $start = strtotime($resched->start_time);
            $completed = strtotime($resched->completed_at);
            $allowedDuration = ($resched->duration_min ?? 0) * 60;

            if (($completed - $start) <= $allowedDuration) {
                $ontimeCount++;
            } else {
                $delayedCount++;
            }
        }

        return [
            'driver_id' => $driver->id,
            'name' => $driver->user->name ?? 'Unknown',
            'ontime_routes' => $ontimeCount,
            'delayed_routes' => $delayedCount,
        ];
    });

    $leaderboard = $drivers->sortByDesc('ontime_routes')->values();

    return response()->json([
        'success' => true,
        'data' => $leaderboard
    ]);
}


}
