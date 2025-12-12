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
        Schema::create('re_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained('driver_profiles')->onDelete('cascade');
            $table->foreignId('barangay_id')->constrained('barangay_profiles')->onDelete('cascade');
            $table->dateTime('pickup_datetime');
            $table->string('status');
            $table->timestamp('completed_at')->nullable();
            $table->text('remarks')->nullable();
             $table->boolean('is_viewed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('re_schedules');
    }
};
