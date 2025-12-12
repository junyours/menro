<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WeeklyReport;
use Carbon\Carbon;

class CloseReports extends Command
{
    // Command signature
    protected $signature = 'reports:close';

    // Command description
    protected $description = 'Close all overdue weekly reports (submitted_at in the past)';

    public function handle()
    {
        $this->info("Starting CloseReports command...");

        try {
            // Current date & time in Manila
            $now = Carbon::now('Asia/Manila')->toDateTimeString();
            $this->info("Current Manila time: {$now}");

            // Get overdue reports that are still open
            $overdueReports = WeeklyReport::where('submitted_at', '<', $now)
                ->where('is_open', 1)
                ->get();

            if ($overdueReports->isEmpty()) {
                $this->info("No overdue reports to close.");
                return 0;
            }

            // Log IDs of reports to be closed
            $this->info("Reports to close: " . $overdueReports->pluck('id')->join(', '));

            // Update all overdue reports to is_open = 0
            $updated = WeeklyReport::where('submitted_at', '<', $now)
                ->where('is_open', 1)
                ->update(['is_open' => 0]);

            $this->info("Closed {$updated} overdue reports successfully.");

            return 0; // success
        } catch (\Exception $e) {
            $this->error("Error closing reports: " . $e->getMessage());
            return 1; // failure
        }
    }
}
