<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\GarbageSchedule;

class BarDashboardController extends Controller
{
  public function index()
{
    $user = auth()->user();

    // Get the user's barangay profile
    $barangayProfile = $user->barangayProfile;

    if (!$barangayProfile) {
        // User has no barangay assigned
        $schedules = collect(); // empty collection
    } else {
        $schedules = GarbageSchedule::with(['truck', 'driver.user', 'barangay'])
            ->where('barangay_id', $barangayProfile->id)
            ->latest()
            ->get();
    }

    return Inertia::render('BarangayDashboard', [
        'schedules' => $schedules,
    ]);
}

}
