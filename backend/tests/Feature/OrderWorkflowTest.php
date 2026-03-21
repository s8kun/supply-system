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

class OrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_partial_and_full_delivery_update_order_status_and_stock(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        $customer = Customer::query()->create([
            'first_name' => 'Ahmed',
            'middle_name' => 'Ali',
            'last_name' => 'Saleh',
            'house_no' => '10',
            'street_name' => 'Main St',
            'city' => 'Tripoli',
            'zip_code' => '218',
            'phone' => '0911111111',
            'credit_limit' => 1000,
        ]);

        $product = Product::query()->create([
            'name' => 'Product A',
            'description' => 'Test',
            'cost_price' => 10,
            'sell_price' => 20,
            'current_quantity' => 50,
            'reorder_level' => 5,
            'reorder_quantity' => 10,
            'images' => [],
        ]);

        $order = Order::query()->create([
            'customer_id' => $customer->customer_id,
            'due_date' => now()->addDay()->toDateString(),
            'total_price' => 60,
            'order_status' => 'pending',
            'is_paid' => false,
        ]);

        $item = OrderItem::query()->create([
            'order_id' => $order->order_id,
            'product_id' => $product->product_id,
            'quantity' => 3,
            'delivered_quantity' => 0,
            'item_total_price' => 60,
            'delivery_status' => 'pending',
        ]);

        Sanctum::actingAs($admin);

        $partial = $this->patchJson("/api/v1/order-items/{$item->order_item_id}", [
            'deliveredQuantity' => 1,
        ]);

        $partial->assertOk();

        $item->refresh();
        $order->refresh();
        $product->refresh();

        $this->assertSame(1, $item->delivered_quantity);
        $this->assertSame('partial', $item->delivery_status->value);
        $this->assertSame('processing', $order->order_status->value);
        $this->assertFalse($order->is_paid);
        $this->assertSame(49, $product->current_quantity);

        $full = $this->patchJson("/api/v1/order-items/{$item->order_item_id}", [
            'deliveredQuantity' => 3,
        ]);

        $full->assertOk();

        $item->refresh();
        $order->refresh();
        $product->refresh();

        $this->assertSame(3, $item->delivered_quantity);
        $this->assertSame('delivered', $item->delivery_status->value);
        $this->assertSame('completed', $order->order_status->value);
        $this->assertTrue($order->is_paid);
        $this->assertSame(47, $product->current_quantity);
    }

    public function test_mark_paid_endpoint_marks_non_cancelled_order_paid(): void
    {
        $supervisor = User::factory()->create([
            'role' => User::ROLE_SUPERVISOR,
        ]);

        $customer = Customer::query()->create([
            'first_name' => 'Mona',
            'middle_name' => 'H.',
            'last_name' => 'Khaled',
            'house_no' => '20',
            'street_name' => 'Second St',
            'city' => 'Benghazi',
            'zip_code' => '219',
            'phone' => '0922222222',
            'credit_limit' => 1200,
        ]);

        $order = Order::query()->create([
            'customer_id' => $customer->customer_id,
            'due_date' => now()->addDay()->toDateString(),
            'total_price' => 100,
            'order_status' => 'processing',
            'is_paid' => false,
        ]);

        Sanctum::actingAs($supervisor);

        $response = $this->postJson("/api/v1/orders/{$order->order_id}/mark-paid", [
            'isPaid' => true,
        ]);

        $response->assertOk();

        $order->refresh();
        $this->assertTrue($order->is_paid);
    }
}
