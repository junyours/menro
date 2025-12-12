<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
    
        'schedule_id',
        'terminal_id',
        'first_name',
        'last_name',
        'username',
        'message',
        'is_viewed',
    ];

    // 🔹 Relationships
    public function schedule()
    {
        return $this->belongsTo(GarbageSchedule::class, 'schedule_id');
    }

    public function terminal()
    {
        return $this->belongsTo(GarbageTerminal::class, 'terminal_id');
    }
}