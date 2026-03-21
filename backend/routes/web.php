<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
Route::get('/', function () {
    return view('welcome');
});
Route::get('/run-queue', function () {
    try {
        // Runs the queue for 1 minute then stops (safe for HTTP requests)
        Artisan::call('queue:work', [
            '--stop-when-empty' => true,
            '--tries' => 3
        ]);
        return response()->json(['status' => 'success', 'message' => 'Queue worker has finished tasks.']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
    }
});
