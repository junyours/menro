    <?php

    use Inertia\Inertia;
    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\Route;
    use App\Http\Controllers\ORSController;
    use App\Http\Controllers\ZoneController;
    use Illuminate\Support\Facades\Redirect;
    use App\Http\Controllers\TruckController;
    use App\Http\Controllers\AdminController;
    use App\Http\Controllers\DriverController;
    use App\Http\Controllers\ProfileController;
    use App\Http\Controllers\BarangayController;
    use App\Http\Controllers\FeedbackController;
    use App\Http\Controllers\SettingsController;
    use App\Http\Controllers\DashboardController;
    use App\Http\Controllers\RoutePlanController;
    use App\Http\Controllers\BarProfileController;
    use App\Http\Controllers\ReScheduleController;
    use App\Http\Controllers\ZonalLeaderController;
    use App\Http\Controllers\BarDashboardController;
    use App\Http\Controllers\NotificationController;
    use App\Http\Controllers\RouteDetailsController;
    use App\Http\Controllers\RouteMonitorController;
    use App\Http\Controllers\WeeklyReportController;
    use App\Http\Controllers\TruckLocationController;
    use App\Http\Controllers\GarbageScheduleController;
    use App\Http\Controllers\GarbageTerminalController;
    use App\Http\Controllers\Auth\NewPasswordController;
    use App\Http\Controllers\WeeklyZoneReportController;
    use App\Http\Controllers\ReportsController;
    use App\Http\Controllers\Auth\PasswordResetLinkController;
    use App\Http\Controllers\DriverStatsController;


    /*
    |--------------------------------------------------------------------------
    | Web Routes
    |--------------------------------------------------------------------------
    */

    Route::get('/', function () {
        if (Auth::check()) {
            // You can also use roles here
            return redirect()->route(Auth::user()->role === 'barangay' ? 'BarDashboard' : 'dashboard');
        }

        return redirect()->route('login');
    });

    Route::get('/about', function () {
        return Inertia::render('About');
    })->name('about');

    // Admin-only routes
    Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Dashboard');
        })->name('dashboard');

        // // Map
        // Route::get('/admap', function () {
        //     return Inertia::render('adminMap');
        // })->name('admap');

        Route::post('/route-details/{id}/viewed', [ReScheduleController::class, 'markAsViewed'])->name('route-details.viewed');
        Route::get('/admin/profile', [AdminController::class, 'profile'])->name('admin.profile');
        Route::get('/admin/{id}', [AdminController::class, 'show'])->whereNumber('id')->name('admin.show');
        Route::put('/profile/update', [AdminController::class, 'updateProfile'])->name('admin.updateProfile');
        Route::put('/password/update', [AdminController::class, 'updatePassword'])->name('admin.updatePassword');
        // Schedule
        Route::prefix('schedule')->name('schedule.')->group(function () {
            Route::get('/create', function () {
                return Inertia::render('schedule/CreateSchedule');
            })->name('create');

            // Route::get('/zones', function () {
            //     return Inertia::render('schedule/ScheduleZones');
            // })->name('zones');

            Route::get('/reports', function () {
                return Inertia::render('schedule/ScheduleReports');
            })->name('reports');
        });

        // Drivers
        Route::get('/drivers', [DriverController::class, 'index'])->name('users.drivers');
        Route::post('/drivers', [DriverController::class, 'store'])->name('drivers.store');
        Route::post('/drivers/profile', [DriverController::class, 'storeProfile'])->name('drivers.profile.store');
        Route::put('/drivers/{driver}', [DriverController::class, 'update'])->name('drivers.update');
        Route::put('/drivers/{id}/toggle-active', [DriverController::class, 'toggleActive'])->name('drivers.toggleActive');
        // Barangays
        Route::get('/barangay', [BarangayController::class, 'index'])->name('users.barangays');
        Route::post('/barangay', [BarangayController::class, 'store'])->name('barangays.store');
        Route::post('/barangay/profile', [BarangayController::class, 'storeProfile'])->name('barangays.profile.store');
        Route::patch('/barangays/{barangay}', [BarangayController::class, 'update'])->name('barangays.update');
        Route::put('/barangays/{barangay}/toggle-active', [BarangayController::class, 'toggleActive'])->name('barangays.toggleActive');
        // Trucks
        Route::get('/trucks', [TruckController::class, 'index'])->name('users.trucks');
        Route::post('/trucks', [TruckController::class, 'store'])->name('trucks.store');
        Route::put('/trucks/{truck}', [TruckController::class, 'update'])->name('trucks.update');

        // Weekly Reports (NEW PROTECTED ROUTE EXAMPLE)
        Route::get('/reports/weekly', function () {
            return Inertia::render('reports/WeeklyReportLogs');
        })->name('reports.weekly');


        //crete Schedule
        Route::get('/schedule/create', [GarbageScheduleController::class, 'index'])->name('schedule.create');
        Route::post('/schedules', [GarbageScheduleController::class, 'store'])->name('schedules.store');
        Route::get('/drivers/by-truck/{truckId}', [GarbageScheduleController::class, 'getDriverByTruck']);


        // Route planning pages
        Route::get('/schedule/zones', [RoutePlanController::class, 'index'])->name('schedule.zones');
        Route::get('/route-plans/{id}', [RoutePlanController::class, 'show'])->name('route.planner.show');

        // Save planned zones to a schedule
        Route::post('/route-planner', [RoutePlanController::class, 'store'])->name('route-planner.store');
        Route::get('/route-planner/check/{scheduleId}', [RoutePlanController::class, 'checkAssigned']);
        Route::get('/weekly-reports/{weeklyReport}/zones', [RoutePlanController::class, 'fetchZones']);
        Route::get('/weekly-reports', [RoutePlanController::class, 'getWeeklyReports']);


        //ORS

        Route::post('/ors/route', [ORSController::class, 'getRoute']);


        //RouteDetails

        Route::post('/route-legs', [RouteDetailsController::class, 'store']); // ✅ store
        Route::get('/route-plans/{routePlanId}/legs', [RouteDetailsController::class, 'index']);
        Route::get('/route-legs/{id}', [RouteDetailsController::class, 'show']);
        Route::patch('/route-legs/{id}/status', [RouteDetailsController::class, 'updateStatus']);


        Route::get('/trucks/{truckId}/history', [TruckLocationController::class, 'getLocationHistory'])->name('trucks.history');
        Route::put('/weekly-reports/{id}/status', [WeeklyReportController::class, 'updateStatus'])->name('weekly-reports.update-status');
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/weekly', [WeeklyReportController::class, 'weeklyReportsPage'])->name('weekly.reports');


        //Reschedule
        Route::get('/route-details/missed', [ReScheduleController::class, 'missed'])
            ->name('route-details.missed');

        Route::post('/route-details/reschedule', [ReScheduleController::class, 'reschedule'])
            ->name('route-details.reschedule.bulk')->middleware('auth');
        Route::get('/barangay/notifications', [ReScheduleController::class, 'notifications'])->name('barangay.notifications');
        //reschuleFunctionsto to view 
        Route::get('/reschedule-details/{scheduleId}', [RouteMonitorController::class, 'AdminRedetails'])->name('ad.details');
        Route::get('/ad/reschedule', [RouteMonitorController::class, 'AdminReSched'])->name('adResched');


        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/notifications/{id}', [NotificationController::class, 'show'])->name('notifications.show');

        // Mark as viewed
        Route::post('/notifications/{id}/view', [NotificationController::class, 'markAsViewed'])->name('notifications.view');
        Route::get('/history', [RouteMonitorController::class, 'showHistory'])->name('History');
        Route::patch('/schedules/{id}/status', [GarbageScheduleController::class, 'updateStatus'])
            ->name('schedules.updateStatus');


        Route::get('/establishments', [ReportsController::class, 'establishments'])->name('reports.establishments');
        Route::get('/collections', [ReportsController::class, 'collections'])->name('reports.collections');
        Route::get('/routes', [ReportsController::class, 'routes'])->name('reports.routes');

        // Feedback report
        Route::get('/reports/feedback', [FeedbackController::class, 'index'])->name('reports.feedback');


        Route::get('/drivers/stats', [DriverStatsController::class, 'getDriverStats'])->name('drivers.stats');

        Route::get('/drivers/schedule-stats/{scheduleId}', [DriverStatsController::class, 'getScheduleStats'])->name('drivers.scheduleStats');
       
        Route::get('/drivers/stats/data', [DriverStatsController::class, 'getDriverWasteCollections'])->name('drivers.stats.data');
        Route::put('/schedules/{id}', [GarbageScheduleController::class, 'update']);
        Route::get('/map-monitor', [RouteMonitorController::class, 'show'])->name('adminMap');

    });

    // Barangay-only dashboard
    Route::middleware(['auth', 'verified', 'role:barangay'])->group(function () {

        Route::get('/BarDashboard', [BarDashboardController::class, 'index'])->name('BarDashboard');
        Route::get('/barangay/profile', [BarProfileController::class, 'index'])->name('BarProfile');
        Route::get('/zones/create', [ZoneController::class, 'create'])->name('zones.create');
        Route::post('/zones', [ZoneController::class, 'store'])->name('zones.store');
        Route::put('/zones/{id}', [ZoneController::class, 'update'])->name('zones.update');
        Route::get('/barangay/weekly', [WeeklyReportController::class, 'index'])->name('barangay.weekly');
        Route::post('/barangay/weekly', [WeeklyReportController::class, 'store'])->name('barangay.weekly.store');
        Route::get('/barangay/zone', [WeeklyZoneReportController::class, 'index'])->name('barangay.zone');
        Route::post('/barangay/zone', [WeeklyZoneReportController::class, 'store'])->name('barangay.zone.store');
        Route::post('/zones/{zone}/routes', [GarbageTerminalController::class, 'store']);

        Route::get('/reports', [WeeklyReportController::class, 'show'])->name('reports.index');

        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings/update', [SettingsController::class, 'update'])->name('settings.update');
        Route::get('/bar/history', [RouteMonitorController::class, 'BarHistory'])->name('BarHistory');
        Route::put('/zones/{id}/update-leader', [ZoneController::class, 'updateLeader'])->name('zones.updateLeader');
    });


    Route::get('/zonal-leaders', [ZonalLeaderController::class, 'index'])->name('zonal-leaders.index');
    Route::post('/zonal-leaders', [ZonalLeaderController::class, 'store'])->name('zonal-leaders.store');
    // Update Zonal Leader Status
    Route::put('/zonal-leaders/{leader}/status', [ZonalLeaderController::class, 'updateStatus'])->name('zonal-leaders.updateStatus');
    Route::put('/zonal-leaders/{id}', [ZonalLeaderController::class, 'update'])->name('zonal-leaders.update');

    Route::put('/terminals/{terminal}/toggle-active', [GarbageTerminalController::class, 'toggleActive'])->name('terminals.toggleActive');
    Route::put('/terminals/{id}/update-households', [GarbageTerminalController::class, 'updateHouseholds']);


    // Shared authenticated user routes
    Route::middleware('auth')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });




    Route::get('/route-monitor', [RouteMonitorController::class, 'index'])->name('Map');
    Route::get('/route-summary/{scheduleId}', [RouteMonitorController::class, 'routeSummary']);
    Route::get('/route-details/{scheduleId}', [RouteMonitorController::class, 'details'])->name('route.details');
    Route::get('/truck-location/{truckId}', [TruckLocationController::class, 'getLocation']);
    Route::get('/re-details/{scheduleId}', [RouteMonitorController::class, 'redetails'])->name('re.details');
    Route::get('/bar/reschedule', [RouteMonitorController::class, 'BarReSched'])->name('BarResched');


    Route::get('/residents/history', [RouteMonitorController::class, 'ResHistory'])->name('ResHistory');

    // // Show feedback form
    // Route::get('/feedback', function () {
    //     return Inertia::render('Feedback');
    // })->name('feedback');


    Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');
    Route::get('/feedback/schedules', [FeedbackController::class, 'getSchedulesByDate'])->name('feedback.schedules');

    Route::middleware('guest')->group(function () {
        Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
            ->name('password.request');

        Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
            ->name('password.email');

        Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
            ->name('password.reset');

        Route::post('reset-password', [NewPasswordController::class, 'store'])
            ->name('password.store');
    });
    require __DIR__ . '/auth.php';
