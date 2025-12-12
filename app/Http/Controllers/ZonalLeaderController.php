<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\ZoneLeader;

use App\Models\WeeklyReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ZonalLeaderController extends Controller
{
  public function index()
{
    $user = Auth::user();
    $barangayProfile = $user->barangayProfile;

    $leaders = ZoneLeader::with('user')
        ->where('barangay_id', $barangayProfile->id)

        ->get();

    return Inertia::render('users/CreateZonalLeaderAccount', [
        'leaders' => $leaders,
        'barangay' => $barangayProfile,
    ]);
}


    public function store(Request $request)
    {
        $barangayProfile = Auth::user()->barangayProfile;

        $validated = $request->validate([
            'firstname'    => 'required|string|max:255',
            'lastname'     => 'required|string|max:255',
            'phone_number' => 'required|string|size:11',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6',
        ]);

        // create user
        $user = User::create([
            'name'     => $validated['firstname'].' '.$validated['lastname'],
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role'     => 'zonal_leader',
        ]);

        // create zonal leader profile
        ZoneLeader::create([
            'user_id'      => $user->id,
            'barangay_id'  => $barangayProfile->id,
            'firstname'    => $validated['firstname'],
            'lastname'     => $validated['lastname'],
            'phone_number' => $validated['phone_number'],
        ]);

        return redirect()->back()->with('success', 'Zonal Leader account created successfully.');
    }

     
    
    
 public function updateStatus(Request $request, ZoneLeader $leader)
{
    $request->validate([
        'is_active' => 'required|boolean',
    ]);

    // Update only the is_active status
    $leader->is_active = $request->is_active;
    $leader->save();

    return redirect()->back()->with('success', 'Status updated successfully.');
}


  // UPDATE ZONAL LEADER INFO
public function update(Request $request, $id)
{
    $leader = ZoneLeader::with('user')->findOrFail($id);

    $validated = $request->validate([
        'firstname' => 'required|string|max:255',
        'lastname' => 'required|string|max:255',
        'phone_number' => 'required|string|size:11',
        'email' => 'required|email|unique:users,email,' . $leader->user->id,
    ]);

    // Update leader personal info
    $leader->update([
        'firstname' => $validated['firstname'],
        'lastname' => $validated['lastname'],
        'phone_number' => $validated['phone_number'],
    ]);

    // Update email in users table
    $leader->user->update([
        'email' => $validated['email'],
        'name' => $validated['firstname'] . ' ' . $validated['lastname'],
    ]);

    // ✅ Return JSON instead of redirect
    return response()->json([
        'message' => 'Zonal leader updated successfully!',
        'leader' => $leader->load('user'),
    ], 200);
}

public function profile(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Find the ZoneLeader profile linked to this user
        $zoneLeader = ZoneLeader::with(['user', 'barangay', 'zones', 'schedules'])
            ->where('user_id', $user->id)
            ->first();

        if (!$zoneLeader) {
            return response()->json(['message' => 'Zone Leader profile not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $zoneLeader
        ]);
    }


public function history(Request $request)
{
    $user = Auth::user();

    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    // Get the zone leader and their assigned zones
    $zoneLeader = ZoneLeader::with('zones')->where('user_id', $user->id)->first();

    if (!$zoneLeader) {
        return response()->json(['message' => 'Zone Leader profile not found'], 404);
    }

    // Extract zone IDs for the logged-in leader
    $zoneIds = $zoneLeader->zones->pluck('id')->toArray();

    // Fetch weekly reports that have at least one zone report belonging to this leader
    $weeklyReports = WeeklyReport::whereHas('zoneReports', function ($query) use ($zoneIds) {
            $query->whereIn('zone_id', $zoneIds);
        })
        ->with(['zoneReports' => function ($query) use ($zoneIds) {
            // Only fetch zone reports assigned to this leader
            $query->whereIn('zone_id', $zoneIds)->with('zone');
        }])
        ->orderBy('comply_on', 'desc')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $weeklyReports
    ]);
}


}
