<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed core data for local testing.
     */
    public function run(): void
    {
// Admin
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@smartsupply.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

// Supervisor
        User::factory()->create([
            'name' => 'Supervisor',
            'email' => 'supervisor@smartsupply.com',
            'password' => Hash::make('password123'),
            'role' => 'supervisor',
        ]);

// Customer
        User::factory()->create([
            'name' => 'Customer',
            'email' => 'customer@smartsupply.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);

        $this->call([
            CustomerSeeder::class,
            ProductSeeder::class,
            RedeemCodeSeeder::class,
            OrderSeeder::class,
            ReorderNoticeSeeder::class,
        ]);
    }
}
