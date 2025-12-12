<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    // Show Admin Profile Page
    public function profile(Request $request)
    {
        $user = $request->user();

        if (strtolower($user->role ?? '') !== 'admin') {
            abort(403, 'Unauthorized');
        }

        return Inertia::render('users/AdminProfile', [
            'admin' => $user,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    // Update Admin Profile Info
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return back()->with('success', 'Profile updated successfully!');
    }

    // Update Admin Password
   public function updatePassword(Request $request)
{
    $user = $request->user();

    $request->validate([
        'current_password' => ['required'],
        'new_password' => [
            'required',
            'confirmed',
            Password::min(8) // Minimum 8 characters
                ->mixedCase() // Must have upper & lower case
                ->letters()   // Must include letters
                ->numbers()   // Must include numbers
                ->symbols()   // Must include special characters
        ],
    ]);

    // Verify old password
    if (!Hash::check($request->current_password, $user->password)) {
        return back()->withErrors(['current_password' => 'Incorrect current password.']);
    }

    // Update new password
    $user->update([
        'password' => Hash::make($request->new_password),
    ]);

    return back()->with('success', 'Password updated successfully!');
}
}
