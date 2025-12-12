<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ORSController;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\RoutePlanController;
use App\Http\Controllers\ReScheduleController;
use App\Http\Controllers\DriverWasteController;
use App\Http\Controllers\ZonalLeaderController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RouteDetailsController;
use App\Http\Controllers\RouteSummaryController;
use App\Http\Controllers\DriverHistoryController;
use App\Http\Controllers\DriverProfileController;
use App\Http\Controllers\TruckLocationController;
use App\Http\Controllers\GarbageScheduleController;
use App\Http\Controllers\GarbageTerminalController;
use App\Http\Controllers\WasteCollectionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\DriverPerformanceController;
use App\Http\Controllers\ZonalLeaderDashboardController;
use App\Http\Controllers\Auth\PasswordResetLinkController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public (no auth)
Route::post('/login', [LoginController::class, 'login']);


Route::middleware('guest')->group(function () {
    // Send reset link
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('api.password.email');

    // Reset password
    Route::post('/reset-password', [NewPasswordController::class, 'store'])
        ->name('api.password.store');
});
// Protected routes (with auth)
Route::middleware('auth:sanctum')->group(function () {

    // ✅ Driver Routes
    Route::middleware('role:driver')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        Route::get('/route-plans', [RoutePlanController::class, 'routePlans']);
        Route::patch('/route-plans/{id}/complete', [RoutePlanController::class, 'markZoneCompleted']);

        Route::patch('/garbage_schedules/{id}/complete', [GarbageScheduleController::class, 'complete']);
        Route::get('/route-details/{routePlanId}', [RouteDetailsController::class, 'showByRoutePlan']);
        Route::patch('/route-details/{id}/status', [RouteDetailsController::class, 'updateStatus']);
        Route::patch('/garbage-schedules/{id}/complete', [RouteDetailsController::class, 'markAsCompleted']);

        Route::post('/ors/route', [ORSController::class, 'getRoute']);

        Route::post('/update-location', [TruckLocationController::class, 'updateLocation']);
        Route::get('/truck-location/{truckId}', [TruckLocationController::class, 'getLocation']);

        Route::get('/reschedules', [ReScheduleController::class, 'index']);
        Route::get('/reschedules/{id}', [ReScheduleController::class, 'show']);
        Route::get('/reschedules/{id}/details', [ReScheduleController::class, 'showByReschedule']);
        Route::patch('/resched-details/{id}/status', [ReScheduleController::class, 'updateStatus']);
        Route::patch('/reschedules/{id}/complete', [ReScheduleController::class, 'complete']);
        Route::get('/driver/profile', [DriverProfileController::class, 'show']);
        Route::get('/garbage-schedules/{id}', [GarbageScheduleController::class, 'show']);
        Route::post('/route-summaries', [RouteSummaryController::class, 'store']);
        Route::get('/summary/{scheduleId}', [RouteSummaryController::class, 'show']);
        Route::patch('/garbage_schedules/{id}/start', [GarbageScheduleController::class, 'start']);
        Route::post('/route', [ORSController::class, 'getingRoute']);
        Route::post('/waste-collections', [WasteCollectionController::class, 'store']);
        Route::post('/waste-collected', [WasteCollectionController::class, 'restore']);
        Route::get('/missed-segments', [NotificationController::class, 'missedSegments']);
        Route::post('/retrieve-segments', [ReScheduleController::class, 'retrieveSelected']);
        Route::get('/driver/stats', [DriverPerformanceController::class, 'getDriverStats']);
        Route::get('/schedule/{scheduleId}/stats', [DriverPerformanceController::class, 'getScheduleStats']);
        Route::get('leaderboard', [DriverPerformanceController::class, 'leaderboard']);
        Route::get('/driver/waste-collections', [DriverWasteController::class, 'getDriverWasteCollections']);
      Route::get('/driver/history', [DriverHistoryController::class, 'getHistory']);
        Route::get('/driver/history/schedule/details', [DriverHistoryController::class, 'getScheduleDetails']);
        Route::get('/driver/history/reschedule/details', [DriverHistoryController::class, 'getRescheduleDetails']);
        Route::get('/garbage-terminals/{id}', [GarbageTerminalController::class, 'show']);

    });

    // ✅ Zonal Leader Routes
    Route::middleware('role:zonal_leader')->group(function () {
        Route::get('/weekly-zones', [ZonalLeaderDashboardController::class, 'index']);
        Route::post('/weekly-zones/segregate', [ZonalLeaderDashboardController::class, 'markSegregated']);
        Route::get('/zone-leader/profile', [ZonalLeaderController::class, 'profile']);
        Route::get('/zone-leader/history', [ZonalLeaderController::class, 'history']);

    });

});
