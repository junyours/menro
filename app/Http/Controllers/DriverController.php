<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\Truck;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;


class DriverController extends Controller
{
   public function index()
{
    $user = Auth::user();
    $driverProfile = null;

    if ($user->role === 'driver') {
        $driverProfile = $user->driverProfile;
    }

    $drivers = User::with('driverProfile.truck')->where('role', 'driver')->get();

  $trucks = Truck::where('status', 'Active')->get();

    return Inertia::render('users/CreateDriverAccount', [
        'user' => $user,
        'driverProfile' => $driverProfile,
        'drivers' => $drivers,
        'trucks' => $trucks // ✅ Send to frontend
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
            'role' => 'driver',
        ]);

        return redirect()->back()->with('success', 'Driver account created successfully.');
    }

    public function storeProfile(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'license_number' => 'required|string',
            'contact_number' => 'required|numeric',
            'assigned_truck_id' => 'nullable|numeric',
        ]);

        $existing = DriverProfile::where('user_id', $validated['user_id'])->first();
        if ($existing) {
            return redirect()->back()->withErrors(['user_id' => 'Profile already exists for this driver.']);
        }

        DriverProfile::create([
            'user_id' => $validated['user_id'],
            'license_number' => $validated['license_number'],
            'contact_number' => $validated['contact_number'],
            'assigned_truck_id' => $validated['assigned_truck_id'],
        ]);

        return redirect()->back()->with('success', 'Driver profile created successfully.');
    }


    public function update(Request $request, User $driver)
{
    $validated = $request->validate([
        'name'           => 'required|string|max:255',
        'email'          => 'nullable|email|max:255',
        'license_number' => [
            'required',
            'string',
            'max:255',
            // Check uniqueness in driver_profiles table, ignoring current driver
            Rule::unique('driver_profiles', 'license_number')->ignore($driver->id, 'user_id'),
        ],
        'contact_number'   => 'required|string|max:255',
        'assigned_truck_id'=> 'nullable|exists:trucks,id',
    ]);

    // Update basic driver info
    $driver->update([
        'name'  => $validated['name'],
        'email' => $validated['email'],
    ]);

    // Update or create profile
    $driver->driverProfile()->updateOrCreate(
        ['user_id' => $driver->id],
        [
            'license_number'   => $validated['license_number'],
            'contact_number'   => $validated['contact_number'],
            'assigned_truck_id'=> $validated['assigned_truck_id'],
        ]
    );

    return redirect()->back()->with('success', 'Driver updated successfully!');
}


 public function toggleActive(Request $request, $id)
    {
        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $driverProfile = DriverProfile::findOrFail($id);
        $driverProfile->is_active = $request->is_active;
        $driverProfile->save();

        return back()->with('success', 'Driver status updated successfully.');
    }

}
