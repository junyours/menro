<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Truck;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TruckController extends Controller
{
    public function index()
    {
        $trucks = Truck::all();
        return Inertia::render('users/CreateTruckDetails', ['trucks' => $trucks]);
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'plate_number' => 'required|string|unique:trucks,plate_number',
        'model'        => 'required|string',
        // Default status to Active if not provided
        'status'       => 'nullable|string',
    ]);

    $validated['status'] = $validated['status'] ?? 'Active';

    Truck::create($validated);

    return redirect()->back()->with('success', 'Truck added successfully.');
}

// Update existing truck
public function update(Request $request, Truck $truck)
{
    $validated = $request->validate([
        'plate_number' => [
            'required',
            'string',
            'max:255',
            // Ensure unique, ignore current truck
            Rule::unique('trucks', 'plate_number')->ignore($truck->id),
        ],
        'model'  => 'required|string|max:255',
        'status' => 'required|in:Active,Inactive,Under_Maintenance',
    ]);

    $truck->update($validated);

    return redirect()->back()->with('success', 'Truck updated successfully!');
}
}

