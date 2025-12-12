<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use App\Models\DeviceToken;

class NotificationHelper
{
    public static function sendToUser($user_id, $title, $body, $data = [])
    {
        if (!$user_id) return;

        $tokens = DeviceToken::where('user_id', $user_id)
            ->pluck('token')
            ->toArray();

        if (empty($tokens)) return;

        $payload = [
            'registration_ids' => $tokens,
            'notification' => [
                'title' => $title,
                'body'  => $body,
                'sound' => 'default',
            ],
            'data' => $data,
        ];

        Http::withHeaders([
            'Authorization' => 'key=' . env('FCM_SERVER_KEY'),
            'Content-Type'  => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', $payload);
    }
}
