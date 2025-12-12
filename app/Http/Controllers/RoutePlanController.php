<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Zone;
use Inertia\Inertia;
use App\Models\RoutePlan;
use App\Models\WeeklyReport;
use Illuminate\Http\Request;
use App\Models\GarbageSchedule;
use App\Models\Route;


class RoutePlanController extends Controller
{
    public function index(Request $request)
    {
        $schedules = GarbageSchedule::with(['truck', 'driver.user', 'barangay'])->get();
        $zones = Zone::with('garbageTerminals')->get();

        if ($request->query('debug')) {
            return response()->json([
                'schedules' => $schedules,
                'zones' => $zones,
            ]);
        }

        return Inertia::render('schedule/ScheduleZones', [
            'schedules' => $schedules,
            'schedule' => null,
            'zones' => $zones,
        ]);
    }

    public function show($id)
    {
        $schedule = GarbageSchedule::with([
            'truck',
            'driver.user',
            'barangay',
            'route_plans.zone.garbageTerminals'
        ])->findOrFail($id);

        $schedules = GarbageSchedule::with(['truck', 'driver.user', 'barangay'])
            ->where('status', 'Ongoing')
            ->get();
        $zones = Zone::with('garbageTerminals')->get();

        $weeklyReport = WeeklyReport::where('barangay_id', $schedule->barangay_id)
            ->latest()
            ->first();

        $weeklyZoneReports = $weeklyReport
            ? $weeklyReport->zoneReports()
            ->with('zone:id,name')
            ->get()
            ->filter(fn($report) => $report->zone !== null)
            ->map(fn($report) => [
                'zone_id'   => $report->zone->id,
                'zone_name' => $report->zone_name,
                'route_path' => $report->zone->route_path,
                'terminals'  => $report->zone->garbageTerminals,
            ])
            ->values()
            : collect();

        return Inertia::render('schedule/ScheduleZones', [
            'schedules' => $schedules,
            'schedule' => $schedule,
            'zones' => $zones,
            'weeklyZoneReports' => $weeklyZoneReports,
        ]);
    }

  public function store(Request $request)
{
    // ✅ Validate request
    $validated = $request->validate([
        'schedule_id'       => 'required|exists:garbage_schedules,id',
        'weekly_report_id'  => 'required|exists:weekly_reports,id',
        'zone_ids'          => 'required|array',
        'zone_ids.*'        => 'required|integer|exists:zones,id',
    ]);

    // ✅ Check if the schedule already has assigned zones
    $alreadyAssigned = RoutePlan::where('schedule_id', $validated['schedule_id'])->exists();

    if ($alreadyAssigned) {
        return response()->json([
            'success' => false,
            'error'   => 'This schedule already has assigned zones. Please create a new schedule.'
        ], 422);
    }

    // ✅ Create route plans
    $createdZones = [];
    foreach ($validated['zone_ids'] as $zoneId) {
        $routePlan = RoutePlan::create([
            'schedule_id'      => $validated['schedule_id'],
            'weekly_report_id' => $validated['weekly_report_id'],
            'zone_id'          => $zoneId,
        ]);

        $createdZones[] = $routePlan->load('zone');
    }

   
    $weeklyReport = WeeklyReport::findOrFail($validated['weekly_report_id']);
    $weeklyReport->status = 'scheduled';
    $weeklyReport->save();

    // ✅ Return JSON response
    return response()->json([
        'success'       => true,
        'zones'         => $createdZones,
        'weekly_report' => $weeklyReport,
        'message'       => 'Route plan created and weekly report marked as scheduled.',
    ]);
}



public function checkAssigned($scheduleId)
{
    $alreadyAssigned = RoutePlan::where('schedule_id', $scheduleId)->exists();

    return response()->json([
        'alreadyAssigned' => $alreadyAssigned,
    ]);
}



 public function routePlans(Request $request)
{
    $user = $request->user();
    $driverProfile = $user->driverProfile;

    if (!$driverProfile) {
        return response()->json(['message' => 'Driver profile not found'], 404);
    }

    // Fetch pending route plans with related data
    $pendingRoutePlans = RoutePlan::with([
            'schedule.truck',
            'schedule.barangay',    
            'zone.garbageTerminals'
        ])
        ->whereHas('schedule', function ($query) use ($driverProfile) {
            $query->where('driver_id', $driverProfile->id)
                  ->where('status', 'pending'); 
        })
        ->get();

    // Count only the schedules that match the pending condition
    $pendingCount = GarbageSchedule::where('driver_id', $driverProfile->id)
        ->where('status', 'pending')
        ->count();

    return response()->json([
        'routePlans' => $pendingRoutePlans,
        'pendingCount' => $pendingCount // ✅ counts schedules, not routePlans
    ]);
}



    public function markZoneCompleted(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:completed', // you can expand this if you have other statuses
        ]);

        $routePlan = RoutePlan::findOrFail($id);

        // Only update if not already completed
        if (!$routePlan->completed_at) {
            $routePlan->status = $request->status;
            $routePlan->completed_at = Carbon::now();
            $routePlan->save();
        }

        return response()->json([
            'message' => 'Zone marked as completed.',
            'data' => $routePlan
        ]);
    }



  public function fetchZones(WeeklyReport $weeklyReport, Request $request)
{
    $zoneReports = $weeklyReport->zoneReports()
        ->where('is_segregated', true)
        ->with(['zone.garbageTerminals' => function($q) {
            $q->where('is_active', true); // ✅ only active terminals
        }]);

    if ($request->filled('zone_ids')) {
        $zoneReports->whereIn('zone_id', $request->zone_ids);
    }

    $zones = $zoneReports->get()->map(fn($report) => [
        'zone_id'       => $report->zone->id,
        'zone_name'     => $report->zone->name,
        'route_path'    => $report->zone->route_path,
        'terminals'     => $report->zone->garbageTerminals, // already filtered

        'report_id'     => $report->id,
        'is_segregated' => $report->is_segregated,
    ]);

    return response()->json(['zones' => $zones]);
}



   public function getWeeklyReports()
{
    $weeklyReports = WeeklyReport::select('id', 'barangay_id', 'submitted_at')
        ->where('status', 'approved') 
        ->get();

    return response()->json($weeklyReports);
}
}
