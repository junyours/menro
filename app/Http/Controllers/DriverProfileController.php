<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DriverProfile;
use Illuminate\Support\Facades\Auth;

class DriverProfileController extends Controller
{
  public function show(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Not authenticated',
            ], 401);
        }

        $profile = DriverProfile::with('user', 'truck')
            ->where('user_id', $user->id)
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Driver profile not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'profile' => $profile,
        ]);
    }
}
