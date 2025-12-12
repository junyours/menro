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
         Schema::create('weekly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->constrained('barangay_profiles')->onDelete('cascade');
            $table->timestamp('comply_on');
            $table->timestamp('submitted_at');
            $table->boolean('is_open')->default(true);
            $table->enum('status', ['pending', 'scheduled', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weekly_reports');
    }
};
