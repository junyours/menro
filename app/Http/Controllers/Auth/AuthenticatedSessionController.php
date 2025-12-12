<?php

namespace App\Http\Controllers\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\BarangayProfile;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use App\Providers\RouteServiceProvider;
use App\Http\Requests\Auth\LoginRequest;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
  public function store(LoginRequest $request): RedirectResponse
{
    $request->authenticate();

    $request->session()->regenerate();

    $user = Auth::user();

    // ✅ If user role is 'barangay', check BarangayProfile status
    if ($user->role === 'barangay') {
        $barangayProfile = BarangayProfile::where('user_id', $user->id)->first();

        if (!$barangayProfile || $barangayProfile->is_active == false) {
            // Force logout if inactive
            Auth::logout();

            return back()->withErrors([
                'email' => 'Your barangay account is inactive. Please contact the administrator.',
            ]);
        }

        // Redirect to barangay dashboard if active
        return redirect()->route('BarDashboard');
    }

    // ✅ Admin redirect
    if ($user->role === 'admin') {
        return redirect()->route('dashboard');
    }

    // ✅ Default redirect (optional for other roles)
    return redirect('/');
}


    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
