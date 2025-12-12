<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Truck;
use App\Models\Barangay;
use App\Models\RouteDetails;
use Illuminate\Http\Request;
use App\Models\BarangayProfile;
use App\Models\GarbageSchedule;
use App\Models\WasteCollections;

class ReportsController extends Controller
{
    /**
     * Establishments & Households Report
     */
public function establishments()
{
    // Load zone leaders → zones → garbage terminals
    $barangays = BarangayProfile::with('zoneLeaders.zones.garbageTerminals')->get()->map(function ($barangay) {
        $terminals = $barangay->terminals(); // all terminals across zones

        // Prepare zones for frontend
        $zones = $barangay->zones->map(function ($zone) {
            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'garbageTerminals' => $zone->garbageTerminals->map(function ($t) {
                    return [
                        'id' => $t->id,
                        'name' => $t->name,
                        'household_count' => $t->household_count,
                        'establishment_count' => $t->establishment_count,
                        'estimated_biodegradable' => $t->estimated_biodegradable,
                        'estimated_non_biodegradable' => $t->estimated_non_biodegradable,
                        'estimated_recyclable' => $t->estimated_recyclable,
                    ];
                }),
            ];
        });

        return [
            'id' => $barangay->id,
            'name' => $barangay->name,
            'total_households' => $terminals->sum('household_count'),
            'total_establishments' => $terminals->sum('establishment_count'),
            'total_biodegradable' => $terminals->sum('estimated_biodegradable'),
            'total_non_biodegradable' => $terminals->sum('estimated_non_biodegradable'),
            'total_recyclable' => $terminals->sum('estimated_recyclable'),
            'zones' => $zones,
        ];
    });

    return Inertia::render('Reports/EstablishmentsReport', [
        'barangays' => $barangays,
    ]);
}

    /**
     * Garbage Collections Report
     */
public function collections(Request $request)
{
    $startDate = $request->input('start_date');
    $endDate   = $request->input('end_date');

    // Load all required relationships including truck, barangay, terminal, zone, driver->user
    $query = WasteCollections::with([
        'routeDetail.schedule.truck',
        'routeDetail.schedule.barangay',
        'routeDetail.schedule.driver.user',        // driver -> user
        'routeDetail.toTerminal',
        'routeDetail.toZone',
        'rescheduleDetail.schedule.truck',
        'rescheduleDetail.schedule.barangay',
        'rescheduleDetail.schedule.driver.user',   // driver -> user
        'rescheduleDetail.toTerminal',
        'rescheduleDetail.toZone',
    ]);

    if ($startDate && $endDate) {
        $query->whereBetween('created_at', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay(),
        ]);
    }

    $collections = $query->orderBy('created_at', 'desc')->get();

    // Map data for table
    $collections->transform(function ($item) {
        // Determine if rescheduled or regular collection
        $detail   = $item->reschedule_detail_id ? $item->rescheduleDetail : $item->routeDetail;
        $schedule = $detail?->schedule;

        $item->schedule_id      = $detail->schedule_id ?? null;
        $item->pickup_datetime  = $schedule?->pickup_datetime;
        $item->truck_name       = $schedule?->truck?->model ?? 'N/A';
        $item->barangay_name    = $schedule?->barangay?->name ?? 'N/A';
        $item->to_terminal_name = $detail?->toTerminal?->name ?? 'N/A';
        $item->to_zone_name     = $detail?->toZone?->name ?? 'N/A';

        // Driver name
        $driver = $schedule?->driver;
        $user   = $driver?->user;
        $item->driver_name = $user?->name ?? 'N/A';

        return $item;
    });

    // --- Analytics ---
    $totalCollections = $collections->count();
    $totalRoutes      = $collections->whereNotNull('route_detail_id')->count();
    $totalReschedules = $collections->whereNotNull('reschedule_detail_id')->count();
    $totalBio         = $collections->sum('biodegradable_sacks');
    $totalNonBio      = $collections->sum('non_biodegradable_sacks');
    $totalRecyclable  = $collections->sum('recyclable_sacks');

    $dailySummary = $collections
        ->groupBy(fn($item) => Carbon::parse($item->created_at)->format('Y-m-d'))
        ->map(fn($dayData) => [
            'bio'        => $dayData->sum('biodegradable_sacks'),
            'non_bio'    => $dayData->sum('non_biodegradable_sacks'),
            'recyclable' => $dayData->sum('recyclable_sacks'),
        ]);

    $collectionTrend = $collections
        ->groupBy(fn($item) => Carbon::parse($item->pickup_datetime)->format('Y-m-d'))
        ->map(fn($dayData) => [
            'total_sacks' => $dayData->sum(function ($c) {
                return ($c->biodegradable_sacks ?? 0)
                    + ($c->non_biodegradable_sacks ?? 0)
                    + ($c->recyclable_sacks ?? 0);
            }),
        ]);

    return Inertia::render('Reports/GarbageCollectionsReport', [
        'collections' => $collections,
        'analytics'   => [
            'total_collections'   => $totalCollections,
            'total_routes'        => $totalRoutes,
            'total_reschedules'   => $totalReschedules,
            'total_bio'           => $totalBio,
            'total_non_bio'       => $totalNonBio,
            'total_recyclable'    => $totalRecyclable,
            'daily_summary'       => $dailySummary,
            'collection_trend'    => $collectionTrend,
        ],
        'filters' => [
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ],
    ]);
}

  /**
 * Routes Report
 */
public function routes(Request $request) 
{
    $scheduleId = $request->input('schedule_id');

    $query = RouteDetails::with([
        'fromZone',
        'toZone',
        'fromTerminal',
        'toTerminal',
        'schedule.barangay'
    ])
    ->whereHas('schedule', function ($q) {
        $q->where('status', '!=', 'pending'); 
    })
    ->orderBy('id', 'desc');

    if ($scheduleId) {
        $query->where('schedule_id', $scheduleId);
    }

    $routes = $query->get();

    /**
     * Count segments per schedule (unique)
     */
    $segmentsBySchedule = $routes->groupBy('schedule_id')->map(function ($group) {
        return $group->unique('id');
    });

    $totalSegments = $segmentsBySchedule
        ->reduce(fn($carry, $set) => $carry + $set->count(), 0);

    /**
     * Normal counts
     */
    $completedCount = $routes->where('status', 'completed')->count();
    $missedCount = $routes->where('status', 'missed')->count();
    $rescheduledCount = $routes->where('status', 'rescheduled')->count();

    $totalSchedules = $routes->pluck('schedule_id')->unique()->count();

    /**
     * NEW: On-Time vs Delayed
     * - duration_min from DB is MINUTES (0.42 min example)
     * - compute actual minutes from timestamps
     * - actual > expected --> delayed
     */
    $onTime = 0;
    $delayed = 0;

    foreach ($routes as $route) {
        if (!$route->start_time || !$route->completed_at) {
            continue; // skip incomplete
        }

        // Expected duration in minutes (from DB)
        $expected = floatval($route->duration_min);

        // Actual duration in minutes
        $start = Carbon::parse($route->start_time);
        $end   = Carbon::parse($route->completed_at);

        $actualMinutes = $start->diffInSeconds($end) / 60;

        // Compare
        if ($actualMinutes <= $expected) {
            $onTime++;
        } else {
            $delayed++;
        }
    }

    /**
     * Schedules List
     */
    $schedules = GarbageSchedule::orderBy('pickup_datetime', 'desc')
        ->get(['id', 'pickup_datetime', 'status']);

    /**
     * Return to view
     */
    return inertia('Reports/RoutesReport', [
        'routes' => $routes,
        'analytics' => [
            'total_segments' => $totalSegments,
            'total_schedules' => $totalSchedules,
            'completed' => $completedCount,
            'missed' => $missedCount,
            'rescheduled' => $rescheduledCount,

            // NEW ANALYTICS
            'on_time' => $onTime,
            'delayed' => $delayed,
        ],
        'schedules' => $schedules,
        'filters' => [
            'schedule_id' => $scheduleId,
        ],
    ]);
}


}
