<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\Truck;
use App\Models\Feedback;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\BarangayProfile;
use App\Models\GarbageSchedule;
use App\Models\RouteDetails;
use App\Models\ReschedDetails;
use App\Models\WeeklyZoneReport;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // ✅ Counts
        $driverCount = DriverProfile::count();
        $truckCount = Truck::count();
        $barangayCount = BarangayProfile::count();

        // ✅ Garbage Schedule Analytics
        $scheduleAnalytics = [
            'total' => GarbageSchedule::count(),
            'pending' => GarbageSchedule::where('status', 'pending')->count(),
            'completed' => GarbageSchedule::where('status', 'completed')->count(),
        ];

        // ✅ Total feedback
        $totalFeedback = Feedback::count();

        // ✅ Feedback by schedule
        $feedbackBySchedule = Feedback::select('schedule_id', DB::raw('COUNT(*) as total'))
            ->groupBy('schedule_id')
            ->with('schedule')
            ->get();

        // ✅ Feedback by terminal
        $feedbackByTerminal = Feedback::select('terminal_id', DB::raw('COUNT(*) as total'))
            ->groupBy('terminal_id')
            ->with('terminal')
            ->get();

        // ✅ Feedback by zone
        $feedbackByZone = Zone::withCount(['garbageTerminals as feedback_count' => function ($query) {
            $query->join('feedback', 'garbage_terminals.id', '=', 'feedback.terminal_id');
        }])->get();

        // ✅ Feedback trend
        $feedbackTrend = Feedback::join('garbage_schedules', 'feedback.schedule_id', '=', 'garbage_schedules.id')
            ->select(
                DB::raw('DATE(garbage_schedules.pickup_datetime) as date'),
                DB::raw('COUNT(feedback.id) as total')
            )
            ->groupBy(DB::raw('DATE(garbage_schedules.pickup_datetime)'))
            ->orderBy('date', 'asc')
            ->get();

        // ✅ Leaderboard (Driver Performance)
        $drivers = DriverProfile::with('user', 'routeDetails', 'reschedDetails')->get();

        $leaderboard = $drivers->map(function ($driver) {
            $ontime = 0;
            $delayed = 0;

            // Regular routes
            foreach ($driver->routeDetails as $route) {
                if ($route->start_time && $route->completed_at) {
                    $duration = strtotime($route->completed_at) - strtotime($route->start_time);
                    if ($duration <= $route->duration_min * 60) {
                        $ontime++;
                    } else {
                        $delayed++;
                    }
                }
            }

            // Rescheduled routes
            foreach ($driver->reschedDetails as $resched) {
                if ($resched->start_time && $resched->completed_at) {
                    $duration = strtotime($resched->completed_at) - strtotime($resched->start_time);
                    if ($duration <= $resched->duration_min * 60) {
                        $ontime++;
                    } else {
                        $delayed++;
                    }
                }
            }

            return [
                'driver_id' => $driver->id,
                'name' => $driver->user->name ?? 'Unknown',
                'ontime_routes' => $ontime,
                'delayed_routes' => $delayed,
            ];
        })
        ->sortByDesc('ontime_routes')
        ->values();

        // ✅ Barangay segregation accuracy
        $barangaySegregationAccuracy = BarangayProfile::select(
            'barangay_profiles.id',
            'barangay_profiles.name',
            DB::raw('
                ROUND(
                    (SUM(CASE WHEN weekly_zone_reports.is_segregated = 1 THEN 1 ELSE 0 END) / COUNT(weekly_zone_reports.id)) * 100,
                    2
                ) as accuracy_percentage
            ')
        )
        ->join('weekly_reports', 'weekly_reports.barangay_id', '=', 'barangay_profiles.id')
        ->join('weekly_zone_reports', 'weekly_zone_reports.weekly_report_id', '=', 'weekly_reports.id')
        ->groupBy('barangay_profiles.id', 'barangay_profiles.name')
        ->get();

        // ✅ Overall segregation average (for summary)
        $overallSegregationAccuracy = round(
            ($barangaySegregationAccuracy->avg('accuracy_percentage')) ?? 0,
            2
        );

        // ✅ Pass everything to Inertia
        return inertia('Dashboard', [
            'driverCount' => $driverCount,
            'truckCount' => $truckCount,
            'barangayCount' => $barangayCount,
            'scheduleAnalytics' => $scheduleAnalytics,

            'totalFeedback' => $totalFeedback,
            'feedbackBySchedule' => $feedbackBySchedule,
            'feedbackByTerminal' => $feedbackByTerminal,
            'feedbackByZone' => $feedbackByZone,
            'feedbackTrend' => $feedbackTrend,

            'leaderboard' => $leaderboard,

            // 👇 Added segregation accuracy
            'barangaySegregationAccuracy' => $barangaySegregationAccuracy,
            'overallSegregationAccuracy' => $overallSegregationAccuracy,
        ]);
    }
}
