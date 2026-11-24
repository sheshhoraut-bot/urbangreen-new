<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ZoneController;
use App\Http\Controllers\Api\PlantController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CareTaskController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\PlantJournalController;
use App\Http\Controllers\Api\PlantSpeciesController;
use App\Http\Controllers\Api\ZoneReadingController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\PasswordResetController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/recover-admin', [AuthController::class, 'recoverAdmin']);

// Forgot password - public, because the user cannot log in
Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:5,1');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::get('/user/preferences', [AuthController::class, 'getPreferences']);
    Route::get('/user/login-history', [AuthController::class, 'getLoginHistory']);
    Route::put('/user/preferences', [AuthController::class, 'updatePreferences']);

    // Read access - any authenticated user (admin or operator)
    Route::get('/zones', [ZoneController::class, 'index']);
    Route::get('/zones/{zone}', [ZoneController::class, 'show']);
    Route::get('/plants', [PlantController::class, 'index']);
    Route::get('/plants/{plant}', [PlantController::class, 'show']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/plant-species', [PlantSpeciesController::class, 'index']);

    // Care tasks
    Route::get('/care-tasks', [CareTaskController::class, 'index']);
    Route::post('/care-tasks', [CareTaskController::class, 'store']);
    Route::put('/care-tasks/{careTask}', [CareTaskController::class, 'update']);
    Route::delete('/care-tasks/{careTask}', [CareTaskController::class, 'destroy']);
    Route::post('/care-tasks/{careTask}/complete', [CareTaskController::class, 'complete']);

    // Notifications
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::post('/alerts/read-all', [AlertController::class, 'markAllRead']);
    Route::post('/alerts/{alert}/read', [AlertController::class, 'markRead']);

    // Plant journal
    Route::get('/plants/{plant}/journal', [PlantJournalController::class, 'index']);
    Route::post('/plants/{plant}/journal', [PlantJournalController::class, 'store']);
    Route::put('/journal-entries/{entry}', [PlantJournalController::class, 'update']);
    Route::delete('/journal-entries/{entry}', [PlantJournalController::class, 'destroy']);

    // Zone readings
    Route::get('/zone-readings', [ZoneReadingController::class, 'index']);
    Route::post('/zone-readings', [ZoneReadingController::class, 'store']);
    Route::put('/zone-readings/{reading}', [ZoneReadingController::class, 'update']);
    Route::delete('/zone-readings/{reading}', [ZoneReadingController::class, 'destroy']);

    // Inventory - everyone can see items and use or restock them
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory/{item}/adjust', [InventoryController::class, 'adjust']);

    // Plants - operators can fully manage (they tend the field day-to-day)
    Route::post('/plants/{plant}/water', [PlantController::class, 'water']);
    Route::post('/plants', [PlantController::class, 'store']);
    Route::put('/plants/{plant}', [PlantController::class, 'update']);
    Route::delete('/plants/{plant}', [PlantController::class, 'destroy']);
    Route::post('/plants/{id}/restore', [PlantController::class, 'restore']);

    // Reports - anyone can generate a fresh report (but not download it)
    Route::post('/reports/generate', [ReportController::class, 'generate']);

    // Write access - admin only
    Route::middleware('admin')->group(function () {
        Route::get('/reports/{reportLog}/download', [ReportController::class, 'download']);

        Route::post('/zones', [ZoneController::class, 'store']);
        Route::put('/zones/{zone}', [ZoneController::class, 'update']);
        Route::delete('/zones/{zone}', [ZoneController::class, 'destroy']);
        Route::post('/zones/{id}/restore', [ZoneController::class, 'restore']);

        Route::get('/users', [AuthController::class, 'listUsers']);
        Route::post('/users', [AuthController::class, 'createUser']);
        Route::put('/users/{user}/role', [AuthController::class, 'updateUserRole']);
        Route::delete('/users/{user}', [AuthController::class, 'deleteUser']);

        Route::post('/plant-species', [PlantSpeciesController::class, 'store']);
        Route::put('/plant-species/{species}', [PlantSpeciesController::class, 'update']);
        Route::delete('/plant-species/{species}', [PlantSpeciesController::class, 'destroy']);

        Route::post('/inventory', [InventoryController::class, 'store']);
        Route::put('/inventory/{item}', [InventoryController::class, 'update']);
        Route::delete('/inventory/{item}', [InventoryController::class, 'destroy']);
    });
});