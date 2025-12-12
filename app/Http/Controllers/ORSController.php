<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ORSController extends Controller
{
    public function getRoute(Request $request)
    {
        $request->validate([
            'coordinates'   => 'required|array|min:2',
            'coordinates.*' => 'array|size:2', // [lng, lat]
        ]);

        $coords = $request->input('coordinates');
        $ORS_API_KEY = env('ORS_API_KEY'); 
        $url = "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson";

        try {
            $response = Http::withHeaders([
                "Authorization" => $ORS_API_KEY,
                "Content-Type"  => "application/json",
            ])->post($url, [
                "coordinates"  => $coords,
                "units"        => "m",
                "language"     => "en",
                "geometry"     => true,
                "instructions" => true,
            ]);

            if ($response->failed()) {
                return response()->json([
                    "error"   => "ORS request failed",
                    "details" => $response->json()
                ], 500);
            }

            $data    = $response->json();
            $feature = $data['features'][0] ?? null;

            if (!$feature) {
                return response()->json(["error" => "No route found"], 404);
            }

            $props    = $feature['properties'] ?? [];
            $geometry = $feature['geometry'] ?? [];
            $summary  = $props['summary'] ?? [];

            $distance = $summary['distance'] ?? null; 
            $duration = $summary['duration'] ?? null; 
            $segments = $props['segments'] ?? [];

            return response()->json([
                "distance"             => $distance,
                "duration"             => $duration,
                "coordinates"          => $geometry['coordinates'] ?? [],
                "segments"             => $segments,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                "error"   => "Exception while fetching ORS",
                "message" => $e->getMessage()
            ], 500);
        }
    }

  public function getingRoute(Request $request)
    {
        $request->validate([
            'from_lat' => 'required|numeric',
            'from_lng' => 'required|numeric',
            'to_lat'   => 'required|numeric',
            'to_lng'   => 'required|numeric',
        ]);

        $apiKey = env('ORS_API_KEY');

        if (empty($apiKey)) {
            return response()->json(['error' => 'ORS API key not configured'], 500);
        }

        $url = "https://api.openrouteservice.org/v2/directions/driving-car";

        $payload = [
            'coordinates' => [
                [(float)$request->from_lng, (float)$request->from_lat],
                [(float)$request->to_lng, (float)$request->to_lat],
            ],
            // optionally add other ORS options like "instructions": false
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiKey,
                'Accept'        => 'application/json',
                'Content-Type'  => 'application/json',
            ])->post($url, $payload);

            if ($response->failed()) {
                // Return the upstream body for debugging if available.
                return response()->json([
                    'error' => 'ORS request failed',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ], 500);
            }

            $data = $response->json();

            // ORS returns coordinates in features[0].geometry.coordinates as [lng, lat] pairs
            if (!isset($data['features'][0]['geometry']['coordinates'])) {
                return response()->json(['error' => 'No route data found'], 404);
            }

            $coords = $data['features'][0]['geometry']['coordinates'];

            $converted = array_map(function ($c) {
                return [
                    'latitude' => $c[1],
                    'longitude' => $c[0],
                ];
            }, $coords);

            return response()->json(['route' => $converted], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Exception contacting ORS',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
