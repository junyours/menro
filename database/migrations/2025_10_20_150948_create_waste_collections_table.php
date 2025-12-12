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
        Schema::create('waste_collections', function (Blueprint $table) {
            $table->id();
            // Either from a normal route OR a rescheduled route
            $table->unsignedBigInteger('route_detail_id')->nullable();
            $table->unsignedBigInteger('reschedule_detail_id')->nullable();
            $table->unsignedBigInteger('biodegradable_sacks')->default(0);
            $table->unsignedBigInteger('non_biodegradable_sacks')->default(0);
            $table->unsignedBigInteger('recyclable_sacks')->default(0);
            $table->timestamps();

              // Foreign keys
            $table->foreign('route_detail_id')->references('id')->on('route_details')->nullOnDelete();
            $table->foreign('reschedule_detail_id')->references('id')->on('reschedule_details')->nullOnDelete();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waste_collections');
    }
};
