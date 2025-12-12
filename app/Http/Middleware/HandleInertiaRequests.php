<?php

namespace App\Http\Middleware;

use Inertia\Middleware;
use App\Models\Feedback;
use App\Models\ReSchedule;
use App\Models\Setting;
use App\Models\WeeklyReport;
use Illuminate\Http\Request;
use App\Models\ReschedDetails;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // ✅ Get settings from DB, fallback defaults if not set
        $settings = Setting::first() ?? (object) [
            'primary_color'   => '#1890ff',
            'secondary_color' => '#52c41a',
            'sidebar_bg'      => '#ffffff',
        ];

        return [
            ...parent::share($request),
            ...parent::share($request),

            'auth' => [
                'user' => $request->user(),

                'notifications' => [
                    'feedbacks' => Feedback::with([
                        'schedule.driver.user',
                        'schedule.barangay',    
                        'terminal.zone'
                    ])
                        ->where('is_viewed', 0)
                        ->latest()
                        ->take(10)
                        ->get(),

                    'weeklyReports' => WeeklyReport::with('barangay:id,name')
                        ->select('id', 'barangay_id', 'submitted_at', 'status')
                        ->whereIn('status', ['pending'])
                        ->latest()
                        ->take(10)
                        ->get(),

                    // ✅ Add ReSchedule with details
                    'reschedules' => ReSchedule::with(['truck', 'driver', 'barangay', 'details.schedule', 'details.fromZone', 'details.toZone', 'details.fromTerminal', 'details.toTerminal'])
                        ->where('status', 'pending') // you can adjust the filter if needed
                        ->latest()
                        ->take(10)
                        ->get(),

                ],
            ],
            'settings' => [
                'primary_color'   => $settings->primary_color,
                'secondary_color' => $settings->secondary_color,
                'sidebar_bg'      => $settings->sidebar_bg,
            ],
        ];
    }
}
