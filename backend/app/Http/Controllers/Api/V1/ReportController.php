<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\FulfillmentReportRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    /**
     * Return fulfillment summary and item-level rows for the selected date range.
     */
    public function fulfillment(FulfillmentReportRequest $request): JsonResponse
    {
        $data = $request->validatedSnake();
        $fromDate = $data['from_date'];
        $toDate = $data['to_date'];

        $orders = Order::query()
            ->with(['customer', 'items.product'])
            ->whereDate('created_at', '>=', $fromDate)
            ->whereDate('created_at', '<=', $toDate)
            ->orderByDesc('created_at')
            ->get();

        $items = $orders->flatMap(function (Order $order) {
            return $order->items->map(function ($item) use ($order) {
                return [
                    'orderId' => $order->order_id,
                    'customerName' => trim(implode(' ', array_filter([
                        $order->customer?->first_name,
                        $order->customer?->middle_name,
                        $order->customer?->last_name,
                    ]))),
                    'productName' => $item->product?->name ?? "Product #{$item->product_id}",
                    'orderedQuantity' => (int) $item->quantity,
                    'deliveredQuantity' => (int) $item->delivered_quantity,
                    'deliveryStatus' => $item->delivery_status,
                    'orderStatus' => $order->order_status,
                    'isPaid' => (bool) $order->is_paid,
                    'dueDate' => $order->due_date,
                    'createdAt' => $order->created_at,
                ];
            });
        })->values();

        $summary = [
            'totalOrders' => $orders->count(),
            'pendingOrders' => $orders->where('order_status', 'pending')->count(),
            'processingOrders' => $orders->where('order_status', 'processing')->count(),
            'completedOrders' => $orders->where('order_status', 'completed')->count(),
            'cancelledOrders' => $orders->where('order_status', 'cancelled')->count(),
            'totalItems' => $items->count(),
            'totalDeliveredQuantity' => (int) $items->sum('deliveredQuantity'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'companyName' => config('app.name', 'Supply Company'),
                'reportName' => 'Orders Fulfillment Report',
                'generatedAt' => now()->toIso8601String(),
                'dateRange' => [
                    'fromDate' => $fromDate,
                    'toDate' => $toDate,
                ],
                'summary' => $summary,
                'items' => $items,
            ],
        ]);
    }
}
