<?php

namespace App\Http\Controllers;

use App\Models\WeeklyReport;
use App\Models\WeeklyZoneReport;
use Illuminate\Http\Request;

class ZonalLeaderDashboardController extends Controller
{
    public function index()
    {
        $userId = auth()->id();

        $weeklyReport = WeeklyReport::whereHas('barangay', function ($query) use ($userId) {
            $query->whereHas('zoneLeaders', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        })
        ->latest()
        ->first();

        if (!$weeklyReport) {
            return response()->json([
                'message' => 'No weekly report found for your barangay.',
                'weekly_report' => null,
                'zones' => [],
                'submission_closed' => true,
            ]);
        }

        $submissionClosed = $weeklyReport->submitted_at && now() >= $weeklyReport->submitted_at;

        $zones = WeeklyZoneReport::with(['zone.zoneLeader.user'])
            ->where('weekly_report_id', $weeklyReport->id)
            ->whereHas('zone.zoneLeader', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'is_segregated' => $report->is_segregated,
                    'zone' => [
                        'id' => $report->zone->id,
                        'name' => $report->zone->name,
                        'route_path' => $report->zone->route_path,
                        'zoneLeader' => [
                            'id' => $report->zone->zoneLeader->id,
                            'firstname' => $report->zone->zoneLeader->firstname,
                            'lastname' => $report->zone->zoneLeader->lastname,
                            'email' => $report->zone->zoneLeader->user->email,
                        ],
                    ],
                ];
            });

        return response()->json([
            'weekly_report' => [
                'id' => $weeklyReport->id,
                'comply_on' => $weeklyReport->comply_on,
                'submitted_at' => $weeklyReport->submitted_at,
                'is_open' => $weeklyReport->is_open, // ✅ include in API
            ],
            'zones' => $zones,
            'submission_closed' => $submissionClosed,
        ]);
    }

    public function markSegregated(Request $request)
    {
        $request->validate([
            'zone_report_id' => 'required|exists:weekly_zone_reports,id',
        ]);

        $zoneReport = WeeklyZoneReport::find($request->zone_report_id);

        if ($zoneReport->zone->zoneLeader->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $weeklyReport = $zoneReport->weeklyReport;

        // ✅ Block if closed by time or DB
        if (
            ($weeklyReport->submitted_at && now() >= $weeklyReport->submitted_at) ||
            !$weeklyReport->is_open
        ) {
            return response()->json([
                'message' => 'Submission Closed. Wait for the next weekly report.'
            ], 403);
        }

        $zoneReport->is_segregated = true;
        $zoneReport->save();

        return response()->json(['message' => 'Zone marked as segregated']);
    }
}
