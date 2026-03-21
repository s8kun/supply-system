<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_customer_with_linked_login_account(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        Sanctum::actingAs($admin);

        $payload = [
            'name' => 'Ahmed Ali Hassan',
            'email' => 'ahmed.customer@gmail.com',
            'password' => 'password123',
            'passwordConfirmation' => 'password123',
            'firstName' => 'Ahmed',
            'middleName' => 'Ali',
            'lastName' => 'Hassan',
            'houseNo' => '12',
            'streetName' => 'King Road',
            'city' => 'Riyadh',
            'zipCode' => '11564',
            'phone' => '0551234567',
            'creditLimit' => 5000.0,
        ];

        $response = $this->postJson('/api/v1/customers', $payload);

        $response->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.phone', '0551234567')
            ->assertJsonPath('data.creditLimit', 5000);

        $user = User::query()->where('email', 'ahmed.customer@gmail.com')->first();
        $customer = Customer::query()->where('phone', '0551234567')->first();

        $this->assertNotNull($user);
        $this->assertNotNull($customer);
        $this->assertSame(User::ROLE_CUSTOMER, $user->role);
        $this->assertSame($user->id, $customer->user_id);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'ahmed.customer@gmail.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.email', 'ahmed.customer@gmail.com')
            ->assertJsonPath('data.user.role', User::ROLE_CUSTOMER)
            ->assertJsonPath('data.customer.customerId', $customer->customer_id);
    }

    public function test_customers_index_excludes_unlinked_mock_customers(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        $linkedUser = User::factory()->create([
            'role' => User::ROLE_CUSTOMER,
            'email' => 'linked.customer@gmail.com',
        ]);

        $linkedCustomer = Customer::query()->create([
            'user_id' => $linkedUser->id,
            'first_name' => 'Linked',
            'middle_name' => 'Real',
            'last_name' => 'Customer',
            'house_no' => '10',
            'street_name' => 'Main St',
            'city' => 'Tripoli',
            'zip_code' => '218',
            'phone' => '0911111111',
            'credit_limit' => 1000,
        ]);

        // Simulate old mock seeded customer (no linked user account).
        Customer::query()->create([
            'first_name' => 'Mock',
            'middle_name' => 'Seeded',
            'last_name' => 'Customer',
            'house_no' => '20',
            'street_name' => 'Second St',
            'city' => 'Benghazi',
            'zip_code' => '219',
            'phone' => '0922222222',
            'credit_limit' => 1500,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/customers');

        $response->assertOk()
            ->assertJsonPath('status', 'success');

        $customers = $response->json('data');
        $listedCustomerIds = collect($customers ?? [])->pluck('customerId')->all();

        $this->assertContains($linkedCustomer->customer_id, $listedCustomerIds);
        $this->assertCount(1, $listedCustomerIds);
    }
}
