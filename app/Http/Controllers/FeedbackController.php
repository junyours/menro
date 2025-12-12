<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use App\Models\GarbageSchedule;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Carbon\Carbon;


class FeedbackController extends Controller
{
    /**
     * Store feedback (basic example).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'schedule_id' => 'required|exists:garbage_schedules,id',
            'terminal_id' => 'required|exists:garbage_terminals,id',
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'message' => 'nullable|string',
            'captchaToken' => 'required',
            'website' => 'nullable|in:',
        ]);

        // Optional: verify the captcha token with Google
        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => config('services.recaptcha.secret'),
            'response' => $validated['captchaToken'],
        ]);

        if (!($response->json()['success'] ?? false)) {
            return back()->withErrors(['captchaToken' => 'Captcha verification failed.']);
        }

        Feedback::create([
         
            'schedule_id'  => $validated['schedule_id'],
            'terminal_id'  => $validated['terminal_id'],
            'first_name'   => $validated['first_name'] ?? null,
            'last_name'    => $validated['last_name'] ?? null,
            'message'      => $validated['message'] ?? null,
            'username'     => auth()->user()->name ?? 'Resident',
            'is_viewed'    => false,
        ]);

        return back()->with('success', 'Feedback submitted successfully!');
    }


    /**
     * API endpoint to fetch schedules by date.
     */
   public function getSchedulesByDate(Request $request)
{
    $request->validate([
        'date' => 'required|date',
    ]);

    $schedules = GarbageSchedule::with([
        'truck',
        'driver.user',
        'barangay',
        'route_details.fromZone',
        'route_details.toZone',
        'route_details.fromTerminal',
        'route_details.toTerminal',
    ])
    ->whereDate('pickup_datetime', $request->date)
    ->get()
    ->map(function ($schedule) {
        return [
            'id' => $schedule->id,
            'pickup_datetime' => $schedule->pickup_datetime,

            // ✅ Truck
            'truck' => $schedule->truck ? [
                'id'    => $schedule->truck->id,
                'plate' => $schedule->truck->plate_number,
                'model' => $schedule->truck->model,
            ] : null,

            // ✅ Driver (from users table)
            'driver' => $schedule->driver && $schedule->driver->user ? [
                'id'   => $schedule->driver->id,
                'name' => $schedule->driver->user->name,
            ] : null,

            // ✅ Barangay
            'barangay' => $schedule->barangay ? [
                'id'   => $schedule->barangay->id,
                'name' => $schedule->barangay->name,
            ] : null,

            // ✅ Route Details
            'route_details' => $schedule->route_details->map(function ($detail) {
                return [
                    'id' => $detail->id,
                    'from_zone' => $detail->fromZone ? [
                        'id'   => $detail->fromZone->id,
                        'name' => $detail->fromZone->name,
                    ] : null,
                    'to_zone' => $detail->toZone ? [
                        'id'   => $detail->toZone->id,
                        'name' => $detail->toZone->name,
                    ] : null,
                    'from_terminal' => $detail->fromTerminal ? [
                        'id'   => $detail->fromTerminal->id,
                        'name' => $detail->fromTerminal->name,
                    ] : null,
                    'to_terminal' => $detail->toTerminal ? [
                        'id'   => $detail->toTerminal->id,
                        'name' => $detail->toTerminal->name,
                    ] : null,
                ];
            }),
        ];
    });

    return response()->json($schedules);
}


    /**
     * Feedback report: list feedback filtered by date range.
     */
    public function index(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $query = Feedback::with(['schedule', 'terminal.zone']);

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ]);
        }

        $feedback = $query
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id'         => $item->id,
                    'created_at' => $item->created_at?->toDateTimeString(),
                    'first_name' => $item->first_name,
                    'last_name'  => $item->last_name,
                    'username'   => $item->username,
                    'message'    => $item->message,
                    'is_viewed'  => (bool) $item->is_viewed,
                    'schedule'   => $item->schedule ? [
                        'id'              => $item->schedule->id,
                        'pickup_datetime' => $item->schedule->pickup_datetime,
                    ] : null,
                    'terminal'   => $item->terminal ? [
                        'id'   => $item->terminal->id,
                        'name' => $item->terminal->name,
                    ] : null,
                    'terminal_zone_name' => $item->terminal && $item->terminal->zone
                        ? $item->terminal->zone->name
                        : null,
                ];
            });

        return Inertia::render('Reports/FeedbackReport', [
            'feedback' => $feedback,
            'filters'  => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
            ],
        ]);
    }

}
