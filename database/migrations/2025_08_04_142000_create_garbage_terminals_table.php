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
        Schema::create('garbage_terminals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('zone_id')->constrained('zones')->onDelete('cascade');
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);

            // ✅ NEW FIELDS (integer-based, since sacks are countable)
            $table->unsignedInteger('household_count')->default(0);
            $table->unsignedInteger('establishment_count')->default(0);

            // ✅ Estimated sack counts (auto-calculated by system)
            $table->unsignedInteger('estimated_biodegradable')->default(0);
            $table->unsignedInteger('estimated_non_biodegradable')->default(0);
            $table->unsignedInteger('estimated_recyclable')->default(0);

            $table->string('qr_code')->nullable();


            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('garbage_terminals');
    }
};
