<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\BarangayProfile;
use Illuminate\Support\Facades\Auth;

class BarangayController extends Controller
{
   public function index()
{
    $user = Auth::user();
    $barangayProfile = null;

    if ($user->role === 'barangay') {
        $barangayProfile = $user->barangayProfile;
    }

    $barangay = User::with('barangayProfile')->where('role', 'barangay')->get();

    return Inertia::render('users/CreateBarangayAccount', [
        'user' => $user,
        'barangayProfile' => $barangayProfile,
        'barangays' => $barangay
    ]);
}


    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => 'barangay',
        ]);

        return redirect()->back()->with('success', 'barangay account created successfully.');
    }

    public function storeProfile(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string',
            'zone_count' => 'required|numeric',
        ]);

        $existing = BarangayProfile::where('user_id', $validated['user_id'])->first();
        if ($existing) {
            return redirect()->back()->withErrors(['user_id' => 'Profile already exists for this barangay.']);
        }

        BarangayProfile::create([
            'user_id' => $validated['user_id'],
            'name' => $validated['name'],
            'zone_count' => $validated['zone_count'],
        ]);

        return redirect()->back()->with('success', 'Driver profile created successfully.');
    }

      // Update barangay (user + profile)
    public function update(Request $request, User $barangay)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'nullable|email|max:255',
            'zone_count' => 'required|integer|min:0',
        ]);

        // Update user (email only here, since name belongs to profile)
        $barangay->update([
            'email' => $validated['email'],
        ]);

        // Update or create barangay profile
        $barangay->barangayProfile()->updateOrCreate(
            ['user_id' => $barangay->id],
            [
                'name'       => $validated['name'],
                'zone_count' => $validated['zone_count'],
            ]
        );

        return redirect()->back()->with('success', 'Barangay updated successfully!');
    }


public function toggleActive(Request $request, User $barangay)
{
    $validated = $request->validate([
        'is_active' => 'required|boolean',
    ]);

    // Find the barangay profile by user_id
    $barangayProfile = BarangayProfile::where('user_id', $barangay->id)->first();

    if (!$barangayProfile) {
        return redirect()->back()->with('error', 'Barangay profile not found.');
    }

    // Update the is_active column
    $barangayProfile->update([
        'is_active' => $validated['is_active'],
    ]);

    return redirect()->back()->with('success', 'Barangay status updated successfully!');
}



}
