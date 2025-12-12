<?php

namespace App\Providers;

use Inertia\Inertia;
use App\Models\Feedback;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
         Inertia::share([
        'auth' => function () {
            return [
                'user' => auth()->user(),
                // ✅ Send feedback as notifications
                'notifications' => Feedback::latest()->take(10)->get(),
            ];
        },
    ]);
}
}
