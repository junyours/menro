<?php

namespace App\Http\Controllers;

use App\Models\TruckLocation;
use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TruckLocationController extends Controller
{
    // Driver updates current location
public function updateLocation(Request $request)
{
    $request->validate([
        'truck_id' => 'required|exists:trucks,id',
        'lat' => 'required|numeric',
        'lng' => 'required|numeric',
    ]);

    // ✅ insert a new row every time
    $location = TruckLocation::create([
        'truck_id' => $request->truck_id,
        'lat' => $request->lat,
        'lng' => $request->lng,
    ]);

    return response()->json([
        'success' => true,
        'truck_id' => $request->truck_id,
        'lat' => $request->lat,
        'lng' => $request->lng,
        'created_at' => $location->created_at, // return timestamp too
    ]);
}

    // Fetch current truck location
    public function getLocation($truckId)
{
    try {
        $truck = Truck::findOrFail($truckId);

        $location = TruckLocation::where('truck_id', $truckId)
                                 ->orderBy('id', 'desc')
                                 ->first();

        if (!$location) {
            return response()->json(['lat' => null, 'lng' => null]);
        }

        return response()->json([
            'lat' => $location->lat,
            'lng' => $location->lng,
        ]);
    } catch (\Exception $e) {
        \Log::error("Truck location error: " . $e->getMessage());
        return response()->json([
            'error' => 'Unable to fetch truck location.'
        ], 500);
    }
    }

public function getLocationHistory(Request $request, $truckId)
{
    $query = TruckLocation::where('truck_id', $truckId);

    if ($request->has('date')) {
        $query->whereDate('created_at', $request->date);
    }

    $locations = $query->orderBy('created_at', 'asc')
                       ->get(['lat', 'lng', 'created_at']);

    $trucks = Truck::all(['id', 'plate_number']); // for dropdown

    return Inertia::render('Truck/LocationHistory', [
        'truckId' => $truckId,
        'trucks' => $trucks,
        'locations' => $locations,
        'selectedDate' => $request->date ?? null,
    ]);
}
}