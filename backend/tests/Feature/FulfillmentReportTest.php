<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FulfillmentReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_get_today_fulfillment_report(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        $customer = Customer::query()->create([
            'first_name' => 'Sara',
            'middle_name' => 'M.',
            'last_name' => 'Nasser',
            'house_no' => '11',
            'street_name' => 'North St',
            'city' => 'Tripoli',
            'zip_code' => '218',
            'phone' => '0933333333',
            'credit_limit' => 3000,
        ]);

        $product = Product::query()->create([
            'name' => 'Widget',
            'description' => 'Report product',
            'cost_price' => 10,
            'sell_price' => 20,
            'current_quantity' => 100,
            'reorder_level' => 10,
            'reorder_quantity' => 25,
            'images' => [],
        ]);

        $order = Order::query()->create([
            'customer_id' => $customer->customer_id,
            'due_date' => now()->addDay()->toDateString(),
            'total_price' => 40,
            'order_status' => 'processing',
            'is_paid' => false,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->order_id,
            'product_id' => $product->product_id,
            'quantity' => 2,
            'delivered_quantity' => 1,
            'item_total_price' => 40,
            'delivery_status' => 'partial',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/reports/fulfillment');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.summary.totalOrders', 1)
            ->assertJsonPath('data.summary.processingOrders', 1)
            ->assertJsonPath('data.summary.totalItems', 1)
            ->assertJsonPath('data.summary.totalDeliveredQuantity', 1)
            ->assertJsonPath('data.items.0.orderId', $order->order_id)
            ->assertJsonPath('data.items.0.deliveredQuantity', 1)
            ->assertJsonPath('data.items.0.deliveryStatus', 'partial');
    }
}
