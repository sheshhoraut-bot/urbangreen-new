<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryController extends Controller
{
    private const CATEGORIES = ['seed', 'fertilizer', 'pesticide', 'supplies', 'other'];

    private function format(InventoryItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'category' => $item->category,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'low_stock_level' => $item->low_stock_level,
            'is_low_stock' => $item->isLowStock(),
            'notes' => $item->notes,
            'updated_at' => $item->updated_at?->toIso8601String(),
        ];
    }

    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'quantity' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'unit' => ['required', 'string', 'max:20'],
            'low_stock_level' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Notify every admin when an item has just dropped to its low-stock level.
     */
    private function notifyLowStock(InventoryItem $item): void
    {
        $admins = User::where('role', 'admin')->get();
        $message = "Low stock: {$item->name} is down to {$item->quantity} {$item->unit} (alert level {$item->low_stock_level} {$item->unit})";

        foreach ($admins as $admin) {
            Alert::create([
                'user_id' => $admin->id,
                'type' => 'low_stock',
                'message' => $message,
                'severity' => 'warning',
                'related_type' => 'inventory_item',
                'related_id' => $item->id,
            ]);
        }
    }

    private function notifyIfCrossedLevel(InventoryItem $item, bool $wasLow): void
    {
        if ($wasLow || !$item->isLowStock()) {
            return;
        }

        try {
            $this->notifyLowStock($item);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::query();

        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }

        $items = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Inventory retrieved successfully',
            'data' => $items->map(fn ($i) => $this->format($i)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = InventoryItem::create($request->validate($this->rules()));
        $this->notifyIfCrossedLevel($item, false);

        return response()->json([
            'success' => true,
            'message' => 'Item added successfully',
            'data' => $this->format($item),
        ], 201);
    }

    public function update(Request $request, InventoryItem $item): JsonResponse
    {
        $wasLow = $item->isLowStock();

        $item->update($request->validate($this->rules()));
        $this->notifyIfCrossedLevel($item, $wasLow);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $this->format($item->fresh()),
        ]);
    }

    public function destroy(InventoryItem $item): JsonResponse
    {
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Item deleted successfully', 'data' => []]);
    }

    /**
     * Use or restock an item: a negative change uses stock, a positive change restocks it.
     */
    public function adjust(Request $request, InventoryItem $item): JsonResponse
    {
        $data = $request->validate([
            'change' => ['required', 'numeric', 'between:-99999999,99999999'],
        ]);

        $change = (float) $data['change'];

        if ($change == 0.0) {
            return response()->json(['success' => false, 'message' => 'Enter an amount other than zero', 'data' => []], 422);
        }

        $newQuantity = $item->quantity + $change;

        if ($newQuantity < 0) {
            return response()->json([
                'success' => false,
                'message' => "Not enough stock: only {$item->quantity} {$item->unit} left",
                'data' => [],
            ], 422);
        }

        $wasLow = $item->isLowStock();

        $item->update(['quantity' => $newQuantity]);
        $this->notifyIfCrossedLevel($item, $wasLow);

        return response()->json([
            'success' => true,
            'message' => $change > 0 ? 'Stock added' : 'Stock used',
            'data' => $this->format($item->fresh()),
        ]);
    }
}