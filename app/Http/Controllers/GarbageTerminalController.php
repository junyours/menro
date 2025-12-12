<?php

// app/Http/Controllers/GarbageTerminalController.php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Zone;
use App\Models\GarbageTerminal;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Throwable;

class GarbageTerminalController extends Controller
{

        public function show($id)
    {
        $terminal = GarbageTerminal::with('zone')->find($id);

        if (!$terminal) {
            return response()->json([
                'message' => 'Terminal not found'
            ], 404);
        }

        return response()->json([
            'data' => $terminal
        ], 200);
    }



    /**
     * Store newly created garbage terminals with generated QR codes.
     */
    public function store(Request $request, Zone $zone)
    {
        $validated = $request->validate([
            'terminals' => 'required|array',
            'terminals.*.name' => 'required|string|max:255',
            'terminals.*.lat' => 'required|numeric',
            'terminals.*.lng' => 'required|numeric',
        ]);

        // ✅ Prevent duplicate coordinates across all zones
        $allTerminals = GarbageTerminal::all();
        foreach ($validated['terminals'] as $terminal) {
            $exists = $allTerminals->first(function ($t) use ($terminal) {
                return floatval($t->lat) === floatval($terminal['lat'])
                    && floatval($t->lng) === floatval($terminal['lng']);
            });

            if ($exists) {
                return back()->withErrors([
                    'terminals' => "The coordinate ({$terminal['lat']}, {$terminal['lng']}) already exists in another zone.",
                ])->withInput();
            }
        }

        // ✅ Ensure QR directory exists
        $qrDir = 'public/qrcodes';
        if (!Storage::exists($qrDir)) {
            Storage::makeDirectory($qrDir, 0755, true);
        }

        // ✅ Process each terminal
        foreach ($validated['terminals'] as $terminal) {
            // Create terminal first
            $newTerminal = GarbageTerminal::create([
                'zone_id' => $zone->id,
                'name' => $terminal['name'],
                'lat' => $terminal['lat'],
                'lng' => $terminal['lng'],
            ]);

            // QR content
            $qrData = "Terminal ID: {$newTerminal->id}\n"
                    . "Zone: {$zone->name}\n"
                    . "Name: {$newTerminal->name}\n"
                    . "Lat: {$newTerminal->lat}\n"
                    . "Lng: {$newTerminal->lng}";

            $fileName = 'terminal_' . $newTerminal->id . '_' . Str::random(6) . '.png';
            $storagePath = $qrDir . '/' . $fileName;
            $publicPath = 'storage/qrcodes/' . $fileName;

            try {
                // ✅ Generate QR code (no GD/Imagick needed)
                $result = Builder::create()
                    ->writer(new PngWriter())
                    ->data($qrData)
                    ->encoding(new Encoding('UTF-8'))
                    ->errorCorrectionLevel(ErrorCorrectionLevel::High)
                    ->size(300)
                    ->margin(10)
                    ->build();

                // ✅ Save QR to storage
                Storage::put($storagePath, $result->getString());

                // ✅ Update DB
                $newTerminal->update(['qr_code' => $publicPath]);

                Log::info("✅ QR saved successfully for Terminal ID {$newTerminal->id}: {$publicPath}");
            } catch (Throwable $e) {
                Log::error("❌ QR generation error for Terminal ID {$newTerminal->id}: " . $e->getMessage());
            }
        }

        return back()->with('success', 'Garbage terminals added successfully with QR codes.');
    }


    
public function toggleActive(Request $request, GarbageTerminal $terminal)
{
    $request->validate([
        'is_active' => 'required|boolean',
    ]);

    $terminal->is_active = $request->is_active;
    $terminal->save();

    // Redirect back so Inertia reloads the page
    return redirect()->back()->with('success', 'Terminal status updated!');
}


  public function updateHouseholds(Request $request, $id)
    {
        $validated = $request->validate([
            'household_count' => 'required|integer|min:0',
            'establishment_count' => 'required|integer|min:0',
            'estimated_biodegradable' => 'nullable|integer|min:0',
            'estimated_non_biodegradable' => 'nullable|integer|min:0',
            'estimated_recyclable' => 'nullable|integer|min:0',
        ]);

        $terminal = GarbageTerminal::findOrFail($id);

        // rates (sacks per collection)
        $rates = [
            'household' => ['bio' => 1, 'non' => 1, 'rec' => 1],
            'establishment' => ['bio' => 3, 'non' => 3, 'rec' => 3],
        ];

        $households = (int) $validated['household_count'];
        $establishments = (int) $validated['establishment_count'];

        // compute floats
        $bioFloat = ($households * $rates['household']['bio']) + ($establishments * $rates['establishment']['bio']);
        $nonFloat = ($households * $rates['household']['non']) + ($establishments * $rates['establishment']['non']);
        $recFloat = ($households * $rates['household']['rec']) + ($establishments * $rates['establishment']['rec']);

        // store integer sacks (use provided estimates if present, otherwise fallback to computed)
        $terminal->household_count = $households;
        $terminal->establishment_count = $establishments;
        $terminal->estimated_biodegradable = isset($validated['estimated_biodegradable'])
            ? (int) $validated['estimated_biodegradable']
            : (int) round($bioFloat);
        $terminal->estimated_non_biodegradable = isset($validated['estimated_non_biodegradable'])
            ? (int) $validated['estimated_non_biodegradable']
            : (int) round($nonFloat);
        $terminal->estimated_recyclable = isset($validated['estimated_recyclable'])
            ? (int) $validated['estimated_recyclable']
            : (int) round($recFloat);
        $terminal->save();

        // return updated terminal - include raw floats as helpful info if you want
        return response()->json([
            'message' => 'Terminal updated successfully',
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'zone_id' => $terminal->zone_id,
                'lat' => $terminal->lat,
                'lng' => $terminal->lng,
                'household_count' => $terminal->household_count,
                'establishment_count' => $terminal->establishment_count,
                'estimated_biodegradable' => $terminal->estimated_biodegradable,
                'estimated_non_biodegradable' => $terminal->estimated_non_biodegradable,
                'estimated_recyclable' => $terminal->estimated_recyclable,
            ],
        ], 200);
    }


}

