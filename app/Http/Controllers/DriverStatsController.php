<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\RouteDetails;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\ReschedDetails;
use App\Models\GarbageSchedule;
use App\Models\WasteCollections;
use Illuminate\Support\Facades\Log;

class DriverStatsController extends Controller
{
    /**
 * Fetch performance stats for a specific driver (optionally by schedule)
 * URL: /drivers/stats?driver_id=1&schedule_id=2
 */
public function getDriverStats(Request $request)
{
    $driverId = $request->input('driver_id');
    $scheduleId = $request->input('schedule_id'); // optional filter

    // ✅ Step 1: Detect if driver_id is actually a user_id (from users table)
    $driverProfile = DriverProfile::where('user_id', $driverId)->first();
    if ($driverProfile) {
        $driverId = $driverProfile->id;
    }

    // ✅ Step 2: Query route details (REGULAR)
    $query = RouteDetails::whereHas('schedule', function ($q) use ($driverId, $scheduleId) {
        $q->where('driver_id', $driverId);
        if ($scheduleId) {
            $q->where('id', $scheduleId);
        }
    });

    $routes = $query->get();

    $total = $routes->count();
    $ontime = 0;
    $delayed = 0;
    $logs = [];
    $routeRecords = [];

    foreach ($routes as $route) {
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
    }

    // ✅ Step 3: Include RESCHEDULED routes (via ReSchedule and ReschedDetails)
    $reschedQuery = ReschedDetails::whereHas('reschedule', function ($q) use ($driverId, $scheduleId) {
        $q->where('driver_id', $driverId);
        if ($scheduleId) {
            $q->where('schedule_id', $scheduleId);
        }
    });

    $reschedRoutes = $reschedQuery->get();

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

    // ✅ Step 4: Return merged data
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
     * Optional: Stats per specific schedule
     * URL: /drivers/schedule-stats/{scheduleId}
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



     public function getDriverWasteCollections(Request $request)
    {
        $driverId = $request->input('driver_id');

        // Step 1: Check if driver_id is user_id
        $driverProfile = DriverProfile::where('user_id', $driverId)->first();
        if ($driverProfile) {
            $driverId = $driverProfile->id;
        }

        // Step 2: Get route_detail IDs
        $routeDetailIds = RouteDetails::whereHas('schedule', function ($q) use ($driverId) {
            $q->where('driver_id', $driverId);
        })->pluck('id');

        // Step 3: Get reschedule_detail IDs
        $reschedDetailIds = ReschedDetails::whereHas('reschedule', function ($q) use ($driverId) {
            $q->where('driver_id', $driverId);
        })->pluck('id');

        // Step 4: Apply optional date range
        $query = WasteCollections::query();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date.' 00:00:00',
                $request->end_date.' 23:59:59',
            ]);
        }

        $totalBiodegradable = $query->whereIn('route_detail_id', $routeDetailIds)
            ->orWhereIn('reschedule_detail_id', $reschedDetailIds)
            ->sum('biodegradable_sacks');

        $totalNonBio = $query->whereIn('route_detail_id', $routeDetailIds)
            ->orWhereIn('reschedule_detail_id', $reschedDetailIds)
            ->sum('non_biodegradable_sacks');

        $totalRecyclable = $query->whereIn('route_detail_id', $routeDetailIds)
            ->orWhereIn('reschedule_detail_id', $reschedDetailIds)
            ->sum('recyclable_sacks');

        $grandTotal = $totalBiodegradable + $totalNonBio + $totalRecyclable;

        return response()->json([
            'success' => true,
            'driver_id' => $driverId,
            'biodegradable' => $totalBiodegradable,
            'non_biodegradable' => $totalNonBio,
            'recyclable' => $totalRecyclable,
            'total_collections' => $grandTotal,
        ]);
    }


  
}
