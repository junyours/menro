<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use Inertia\Inertia;
use App\Models\WeeklyReport;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\WeeklyZoneReport;
use Illuminate\Support\Facades\Log;

class WeeklyZoneReportController extends Controller
{
public function index()
{
    $barangay = auth()->user()->barangayProfile;

    // Get latest weekly report
    $weeklyReport = WeeklyReport::where('barangay_id', $barangay->id)
        ->latest()
        ->first();

    if (!$weeklyReport) {
        return back()->withErrors(['report' => 'No weekly report found.']);
    }

    // 🔹 Get zones where the zone leader belongs to this barangay AND is active
    $zones = Zone::whereNotNull('route_path')
        ->whereHas('zoneLeader', function ($query) use ($barangay) {
            $query->where('barangay_id', $barangay->id)
                  ->where('is_active', true); // only active zone leaders
        })
        ->with([
            'zoneLeader.user',
            // Only include active garbage terminals
            'garbageTerminals' => function ($q) {
                $q->where('is_active', true);
            }
        ])
        ->get()
        ->map(function ($zone) {
            return [
                'id' => $zone->id,
                'name' => $zone->name,
                'route_path' => $zone->route_path,
                'zoneLeader' => $zone->zoneLeader
                    ? [
                        'id' => $zone->zoneLeader->id,
                        'firstname' => $zone->zoneLeader->firstname,
                        'lastname' => $zone->zoneLeader->lastname,
                        'email' => $zone->zoneLeader->user?->email,
                        'is_active' => $zone->zoneLeader->is_active,
                    ]
                    : null,
                'garbage_terminals' => $zone->garbageTerminals->map(fn($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'lat' => $t->lat,
                    'lng' => $t->lng,
                    'is_active' => $t->is_active,
                ]),
            ];
        });

    // Existing reports
    $existingReports = $weeklyReport->zoneReports()
        ->with([
            'zone.zoneLeader.user',
            'zone.garbageTerminals' => function ($q) {
                $q->where('is_active', true); // only active terminals
            }
        ])
        ->get()
        ->map(function ($report) {
            return [
                'id' => $report->id,
                'zone_id' => $report->zone_id,
                'zone' => $report->zone
                    ? [
                        'id' => $report->zone->id,
                        'name' => $report->zone->name,
                        'route_path' => $report->zone->route_path,
                        'zoneLeader' => $report->zone->zoneLeader
                            ? [
                                'id' => $report->zone->zoneLeader->id,
                                'firstname' => $report->zone->zoneLeader->firstname,
                                'lastname' => $report->zone->zoneLeader->lastname,
                                'email' => $report->zone->zoneLeader->user?->email,
                                'is_active' => $report->zone->zoneLeader->is_active,
                            ]
                            : null,
                        'garbage_terminals' => $report->zone->garbageTerminals->map(fn($t) => [
                            'id' => $t->id,
                            'name' => $t->name,
                            'lat' => $t->lat,
                            'lng' => $t->lng,
                            'is_active' => $t->is_active,
                        ]),
                    ]
                    : null,
            ];
        });

    return Inertia::render('Barangay/ZoneReport', [
        'weeklyReport'    => $weeklyReport,
        'zones'           => $zones,
        'existingReports' => $existingReports,
    ]);
}



   public function store(Request $request)
{
    // ✅ Only validate zones if weekly_report_id exists
    $request->validate([
        'weekly_report_id' => 'required|integer',
        'zones' => 'required|array',
        'zones.*' => [
            'required',
            Rule::exists('zones', 'id'),
        ],
    ]);

    $weeklyReportId = $request->input('weekly_report_id');

    // ✅ Check if weekly report exists
    $weeklyReport = WeeklyReport::find($weeklyReportId);

    if (!$weeklyReport) {
        return redirect()->back()->withErrors([
            'report' => 'No active weekly report exists. Please create a weekly report first.',
        ]);
    }
    // ✅ Delete old zone reports for this weekly report
    WeeklyZoneReport::where('weekly_report_id', $weeklyReport->id)->delete();

    foreach ($request->zones as $zoneId) {
        WeeklyZoneReport::create([
            'weekly_report_id' => $weeklyReport->id,
            'zone_id' => $zoneId,
            'is_segregated' => false,
        ]); 
    }

    return redirect()->back()->with('success', 'Zone report saved successfully.');
}
}
