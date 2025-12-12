<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('route_details', function (Blueprint $table) {
             $table->id();
            $table->unsignedBigInteger('schedule_id'); 
            $table->unsignedBigInteger('from_zone_id')->nullable();
            $table->unsignedBigInteger('from_terminal_id')->nullable();
            $table->unsignedBigInteger('to_zone_id')->nullable();
            $table->unsignedBigInteger('to_terminal_id')->nullable();

            $table->decimal('distance_km', 8, 2)->nullable();
            $table->decimal('distance_m', 8, 2)->nullable();
            $table->decimal('duration_min', 8, 2)->nullable();
            $table->decimal('speed_kmh', 8, 2)->nullable();

            $table->enum('status', ['pending', 'completed', 'missed', 'rescheduled'])->default('pending');
            $table->timestamp('start_time')->nullable();  
            $table->timestamp('completed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('is_viewed')->default(false);
            $table->timestamps();

            // Foreign Keys
            $table->foreign('schedule_id')->references('id')->on('garbage_schedules')->onDelete('cascade');
            $table->foreign('from_zone_id')->references('id')->on('zones')->nullOnDelete();
            $table->foreign('to_zone_id')->references('id')->on('zones')->nullOnDelete();
            $table->foreign('from_terminal_id')->references('id')->on('garbage_terminals')->nullOnDelete();
            $table->foreign('to_terminal_id')->references('id')->on('garbage_terminals')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_details');
    }
};
