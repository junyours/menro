<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::first() ?? new Setting();
        return Inertia::render('Settings/Index', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'primary_color' => 'required|string',
            'secondary_color' => 'required|string',
            'sidebar_bg' => 'required|string',
        ]);

        $settings = Setting::first();
        if (!$settings) {
            $settings = Setting::create($data);
        } else {
            $settings->update($data);
        }

        return redirect()->back()->with('success', 'Theme updated successfully!');
    }
}