<?php

namespace App\Services;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderItemService
{
    /**
     * Inject reorder notice service for stock alerts.
     */
    public function __construct(private ReorderNoticeService $reorderNoticeService)
    {
    }

    /**
     * Update delivered quantity, adjust stock delta, and synchronize statuses.
     */
    public function updateDeliveryStatus(OrderItem $orderItem, int $deliveredQuantity): OrderItem
    {
        return DB::transaction(function () use ($orderItem, $deliveredQuantity): OrderItem {
            $orderItem->refresh();

            if ($orderItem->order && $orderItem->order->order_status === OrderStatus::CANCELLED) {
                throw ValidationException::withMessages([
                    'delivery_status' => ['Cannot deliver items for a cancelled order.'],
                ]);
            }

            if ($deliveredQuantity < $orderItem->delivered_quantity) {
                throw ValidationException::withMessages([
                    'delivered_quantity' => ['Delivered quantity cannot decrease.'],
                ]);
            }

            if ($deliveredQuantity > $orderItem->quantity) {
                throw ValidationException::withMessages([
                    'delivered_quantity' => ['Delivered quantity cannot exceed ordered quantity.'],
                ]);
            }

            $delta = $deliveredQuantity - (int) $orderItem->delivered_quantity;
            if ($delta === 0) {
                return $orderItem->load(['order', 'product']);
            }

            $product = Product::query()
                ->where('product_id', $orderItem->product_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($product->current_quantity < $delta) {
                throw ValidationException::withMessages([
                    'delivery_status' => ['Not enough stock to deliver this item.'],
                ]);
            }

            $product->current_quantity = $product->current_quantity - $delta;
            $product->save();
            $this->reorderNoticeService->createIfNeeded($product);

            $orderItem->delivered_quantity = $deliveredQuantity;
            $orderItem->delivery_status = $deliveredQuantity === (int) $orderItem->quantity
                ? DeliveryStatus::DELIVERED
                : DeliveryStatus::PARTIAL;
            $orderItem->save();

            $order = $orderItem->order()->lockForUpdate()->first();
            if ($order) {
                $this->syncOrderStatusFromItems($order);
            }

            return $orderItem->load(['order', 'product']);
        });
    }

    /**
     * Synchronize order status based on item delivery quantities.
     */
    public function syncOrderStatusFromItems(Order $order): void
    {
        if ($order->order_status === OrderStatus::CANCELLED) {
            return;
        }

        $items = $order->items()->get(['quantity', 'delivered_quantity']);
        $totalOrdered = (int) $items->sum('quantity');
        $totalDelivered = (int) $items->sum('delivered_quantity');

        if ($totalOrdered === 0 || $totalDelivered === 0) {
            $nextStatus = OrderStatus::PENDING;
        } elseif ($totalDelivered < $totalOrdered) {
            $nextStatus = OrderStatus::PROCESSING;
        } else {
            $nextStatus = OrderStatus::COMPLETED;
            $order->is_paid = true;
        }

        if ($order->order_status !== $nextStatus || ($nextStatus === OrderStatus::COMPLETED && !$order->is_paid)) {
            $order->order_status = $nextStatus;
            $order->save();
        }
    }

    /**
     * Backward-compatible helper for full delivery transitions.
     */
    public function markFullyDelivered(OrderItem $orderItem): OrderItem
    {
        return $this->updateDeliveryStatus($orderItem, (int) $orderItem->quantity);
    }
}
