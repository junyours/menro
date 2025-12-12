<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGarbageSchedulesTable extends Migration
{
    public function up()
    {
        Schema::create('garbage_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks')->onDelete('cascade');
            $table->foreignId('driver_id')->constrained('driver_profiles')->onDelete('cascade');
            $table->foreignId('barangay_id')->constrained('barangay_profiles')->onDelete('cascade');
            $table->dateTime('pickup_datetime');
            $table->string('status');
            $table->text('remarks')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('garbage_schedules');
    }
}
