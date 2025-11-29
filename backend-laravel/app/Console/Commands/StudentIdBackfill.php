<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Str;

class StudentIdBackfill extends Command
{
    /**
     * The name and signature of the console command.
     *
     * - `--fill` will generate IDs for users missing student_id
     * - `--file=` will import CSV with columns: email,student_id
     */
    protected $signature = 'student:backfill {--fill : Generate student_id for missing users} {--file= : CSV file path to import (email,student_id)}';

    /**
     * The console command description.
     */
    protected $description = 'List users missing student_id and optionally backfill or import from CSV';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $file = $this->option('file');
        $doFill = $this->option('fill');

        if ($file) {
            return $this->importFromCsv($file);
        }

        $missing = User::whereNull('student_id')->get();
        $count = $missing->count();
        $this->info("Users missing student_id: {$count}");

        if ($count === 0) {
            return 0;
        }

        $this->table(['id','email','name','created_at'], $missing->map(function($u){
            return [$u->id, $u->email, $u->name, (string)$u->created_at];
        })->toArray());

        if ($doFill) {
            if (! $this->confirm('This will generate and write student_id values for the listed users. Continue?')) {
                $this->info('Aborted');
                return 0;
            }

            foreach ($missing as $user) {
                // Generate a reasonably unique student id: S{year}{id}
                $year = now()->format('Y');
                $base = "S{$year}-{$user->id}";
                $candidate = $base;
                $suffix = 0;
                while (User::where('student_id', $candidate)->exists()) {
                    $suffix++;
                    $candidate = $base . '-' . $suffix;
                }
                $user->student_id = $candidate;
                $user->save();
                $this->line("Set user {$user->email} -> {$candidate}");
            }
            $this->info('Backfill complete');
        } else {
            $this->info('Run with --fill to generate student_id values, or --file=path.csv to import from CSV');
        }

        return 0;
    }

    protected function importFromCsv($path)
    {
        if (! file_exists($path)) {
            $this->error('File not found: ' . $path);
            return 1;
        }
        $handle = fopen($path, 'r');
        if (! $handle) {
            $this->error('Unable to open file');
            return 1;
        }
        $row = 0;
        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            if ($row === 1 && (strpos(strtolower($data[0]), 'email') !== false)) {
                continue; // skip header
            }
            $email = trim($data[0] ?? '');
            $sid = trim($data[1] ?? '');
            if (! $email || ! $sid) {
                $this->line("Skipping invalid row {$row}");
                continue;
            }
            $user = User::where('email', $email)->first();
            if (! $user) {
                $this->line("No user with email {$email}, skipping");
                continue;
            }
            // check uniqueness
            if (User::where('student_id', $sid)->where('id', '!=', $user->id)->exists()) {
                $this->line("Student ID {$sid} already used by another user, skipping for {$email}");
                continue;
            }
            $user->student_id = $sid;
            $user->save();
            $this->line("Updated {$email} -> {$sid}");
        }
        fclose($handle);
        $this->info('Import complete');
        return 0;
    }
}
