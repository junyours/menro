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
        Schema::create('route_summaries', function (Blueprint $table) {
            $table->id();
             $table->unsignedBigInteger('schedule_id'); // Link to garbage schedule
            $table->integer('completed_count')->default(0);
             $table->integer('missed_count')->default(0);   // 👈 Added
            $table->integer('total_duration')->default(0); // in minutes or seconds
            $table->json('missed_reasons')->nullable();
            $table->timestamps();

          
            $table->foreign('schedule_id')
                  ->references('id')
                  ->on('garbage_schedules')
                  ->onDelete('cascade'); // Optional: deletes summary if route_details is deleted
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_summaries');
    }
};
