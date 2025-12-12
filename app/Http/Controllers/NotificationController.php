<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Feedback;
use App\Models\RouteDetails;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        // Example: get latest 10 feedbacks
        $notifications = Feedback::latest()->take(10)->get();

        return inertia('Notifications', [
            'notifications' => $notifications,
        ]);
    }


    public function show($id)
{
    $notification = Feedback::with(['schedule', 'terminal.zone'])->findOrFail($id);

    // Optionally mark as viewed
    if (!$notification->is_viewed) {
        $notification->is_viewed = true;
        $notification->save();
    }

    return Inertia::render('Notifications', [
        'notification' => $notification,
    ]);
}

     public function markAsViewed($id)
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->update(['is_viewed' => true]);

        return back()->with('success', 'Notification marked as read.');
    }


    public function missedSegments()
    {
        // Fetch all missed segments with related schedule + zones/terminals
        $missedSegments = RouteDetails::with([
            'schedule.driver.user',
            'schedule.barangay',  
            'fromZone',
            'toZone',
            'fromTerminal',
            'toTerminal'
        ])
        ->where('status', 'missed')
        ->where('is_viewed', false)
        ->orderBy('updated_at', 'desc')
        ->get();

        return response()->json([
            'count' => $missedSegments->count(),
            'segments' => $missedSegments
        ]);
    }
}
