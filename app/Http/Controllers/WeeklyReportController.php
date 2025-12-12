<?php

namespace App\Http\Controllers;


use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\WeeklyReport;
use Illuminate\Http\Request;



class WeeklyReportController extends Controller
{

public function index()
{
    $barangay = auth()->user()->barangayProfile;

    if (!$barangay) {
        return Inertia::render('Barangay/WeeklyReport', [
            'auth' => ['user' => auth()->user()],
            'reports' => [],
        ]);
    }

    // ✅ Auto-close reports whose submitted_at matches today (Manila)
    $today = Carbon::now('Asia/Manila')->toDateString();

    WeeklyReport::where('barangay_id', $barangay->id)
        ->whereDate('submitted_at', $today)
        ->where('is_open', true)
        ->update(['is_open' => false]);

    // Fetch reports again after update
    $reports = $barangay->weeklyReports()
        ->with('barangay')
        ->latest()
        ->get()
        ->map(function ($report) {
            return [
                'id'           => $report->id,
                'comply_on'    => $report->comply_on,
                'submitted_at' => $report->submitted_at,
                'status'       => $report->status,
                'is_open'      => $report->is_open, // ✅ include new field
                'barangay'     => $report->barangay,
            ];
        });

    return Inertia::render('Barangay/WeeklyReport', [
        'auth' => [
            'user' => auth()->user(),
        ],
        'reports' => $reports,
    ]);
}


 public function show()
    {
        // Load weekly reports for the authenticated user's barangay
        $barangay = auth()->user()->barangayProfile;

        $weeklyReports = WeeklyReport::with(['zoneReports.zone'])
            ->where('barangay_id', $barangay->id)
            ->orderByDesc('comply_on')
            ->get();

        return Inertia::render('Barangay/Reports', [
            'weeklyReports' => $weeklyReports
        ]);
    }

    public function store(Request $request)
{
    $request->validate([
        'comply_on' => 'required|date',
        'submitted_at' => 'required|date',
    ]);

    $barangay = auth()->user()->barangayProfile;

    if (!$barangay) {
        return back()->withErrors(['barangay' => 'Barangay profile not found for this user.']);
    }

    WeeklyReport::create([
        'barangay_id' => $barangay->id,
        'comply_on' => $request->comply_on,
        'submitted_at' => $request->submitted_at,
        'status'       => 'pending',
        'is_open'     => true, 
    ]);

    return redirect()->back()->with('success', 'Weekly report submitted successfully.');
}




public function weeklyReportsPage()
{
    // Fetch reports grouped by status with latest first
    $pendingReports = WeeklyReport::with(['barangay:id,name', 'zoneReports.zone'])
        ->select('id', 'barangay_id', 'submitted_at', 'status')
        ->where('status', 'pending')
        ->orderByDesc('submitted_at')
        ->get();

    $approvedReports = WeeklyReport::with(['barangay:id,name', 'zoneReports.zone'])
        ->select('id', 'barangay_id', 'submitted_at', 'status')
        ->where('status', 'scheduled')
        ->orderByDesc('submitted_at')
        ->get();

    return Inertia::render('schedule/ScheduleReports', [
        'pendingReports' => $pendingReports,
        'approvedReports' => $approvedReports,
    ]);
}

public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,scheduled,approved,rejected',
        ]);

        $report = WeeklyReport::findOrFail($id);
        $report->status = $request->status;
        $report->save();

        return response()->json([
            'message' => 'Status updated successfully',
            'status' => $report->status,
        ]);
    }

}
