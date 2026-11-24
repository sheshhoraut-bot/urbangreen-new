<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Plant;
use App\Models\PlantSpecies;
use App\Models\User;
use App\Models\ZoneReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneReadingController extends Controller
{
    private const METRICS = [
        'temperature' => ['label' => 'temperature', 'unit' => "\u{00B0}C", 'min' => 'temp_min', 'max' => 'temp_max'],
        'humidity' => ['label' => 'humidity', 'unit' => '%', 'min' => 'humidity_min', 'max' => 'humidity_max'],
        'soil_moisture' => ['label' => 'soil moisture', 'unit' => '%', 'min' => 'soil_moisture_min', 'max' => 'soil_moisture_max'],
        'ph' => ['label' => 'pH', 'unit' => '', 'min' => 'ph_min', 'max' => 'ph_max'],
    ];

    private function format(ZoneReading $reading): array
    {
        $reading->loadMissing(['zone:id,name', 'user:id,name']);

        return [
            'id' => $reading->id,
            'zone_id' => $reading->zone_id,
            'zone' => $reading->zone?->name,
            'user_id' => $reading->user_id,
            'author' => $reading->user?->name,
            'recorded_at' => $reading->recorded_at->toIso8601String(),
            'temperature' => $reading->temperature,
            'humidity' => $reading->humidity,
            'soil_moisture' => $reading->soil_moisture,
            'ph' => $reading->ph,
            'notes' => $reading->notes,
        ];
    }

    private function rules(): array
    {
        return [
            'zone_id' => ['required', 'exists:zones,id'],
            'recorded_at' => ['nullable', 'date'],
            'temperature' => ['nullable', 'numeric', 'between:-10,60'],
            'humidity' => ['nullable', 'integer', 'between:0,100'],
            'soil_moisture' => ['nullable', 'integer', 'between:0,100'],
            'ph' => ['nullable', 'numeric', 'between:0,14'],
            'notes' => ['nullable', 'string'],
        ];
    }

    private function hasAnyValue(array $data): bool
    {
        foreach (['temperature', 'humidity', 'soil_moisture', 'ph'] as $key) {
            if (isset($data[$key]) && $data[$key] !== '') {
                return true;
            }
        }

        return false;
    }

    private function canModify(Request $request, ZoneReading $reading): bool
    {
        $user = $request->user();

        return $user->role === 'admin' || $reading->user_id === $user->id;
    }

    /**
     * Compare a new reading with the ideal range of EACH plant type in its zone
     * and notify every admin about each plant type that is out of range.
     * Returns how many notifications were created.
     */
    private function notifyIfOutOfRange(ZoneReading $reading): int
    {
        $reading->loadMissing('zone:id,name');

        $names = Plant::where('zone_id', $reading->zone_id)
            ->whereNotNull('species')
            ->pluck('species')
            ->map(fn ($s) => strtolower(trim($s)))
            ->unique()
            ->values()
            ->all();

        if (count($names) === 0) {
            return 0;
        }

        $species = PlantSpecies::all()
            ->filter(fn ($s) => in_array(strtolower(trim($s->name)), $names, true))
            ->values();

        if ($species->isEmpty()) {
            return 0;
        }

        $zoneName = $reading->zone?->name ?? 'Zone';
        $admins = User::where('role', 'admin')->get();
        $created = 0;

        foreach (self::METRICS as $key => $meta) {
            $value = $reading->{$key};
            if ($value === null) {
                continue;
            }

            $unit = $meta['unit'];

            foreach ($species as $s) {
                $lo = $s->{$meta['min']};
                $hi = $s->{$meta['max']};

                if ($lo === null && $hi === null) {
                    continue;
                }

                $status = null;
                if ($lo !== null && $value < (float) $lo) {
                    $status = 'too low';
                } elseif ($hi !== null && $value > (float) $hi) {
                    $status = 'too high';
                }
                if ($status === null) {
                    continue;
                }

                if ($lo !== null && $hi !== null) {
                    $ideal = 'ideal ' . (float) $lo . '-' . (float) $hi . $unit;
                } elseif ($lo !== null) {
                    $ideal = 'ideal ' . (float) $lo . $unit . ' or more';
                } else {
                    $ideal = 'ideal up to ' . (float) $hi . $unit;
                }

                $message = "{$zoneName} {$meta['label']} is {$value}{$unit}, {$status} for {$s->name} ({$ideal})";

                foreach ($admins as $admin) {
                    Alert::create([
                        'user_id' => $admin->id,
                        'type' => 'reading_out_of_range',
                        'message' => $message,
                        'severity' => 'warning',
                        'related_type' => 'zone_reading',
                        'related_id' => $reading->id,
                    ]);
                    $created++;
                }
            }
        }

        return $created;
    }

    public function index(Request $request): JsonResponse
    {
        $days = min(max((int) $request->get('days', 7), 1), 90);

        $query = ZoneReading::with(['zone:id,name', 'user:id,name'])
            ->where('recorded_at', '>=', now()->subDays($days));

        if ($request->filled('zone_id')) {
            $query->where('zone_id', $request->get('zone_id'));
        }

        $readings = $query->orderByDesc('recorded_at')->limit(500)->get();

        return response()->json([
            'success' => true,
            'message' => 'Readings retrieved successfully',
            'data' => $readings->map(fn ($r) => $this->format($r)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        if (!$this->hasAnyValue($data)) {
            return response()->json([
                'success' => false,
                'message' => 'Enter at least one reading (temperature, humidity, soil moisture or pH)',
                'data' => [],
            ], 422);
        }

        $data['user_id'] = $request->user()->id;
        $data['recorded_at'] = $data['recorded_at'] ?? now();

        $reading = ZoneReading::create($data);

        $alertsCreated = 0;
        try {
            $alertsCreated = $this->notifyIfOutOfRange($reading);
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reading logged',
            'data' => $this->format($reading),
            'alerts_created' => $alertsCreated,
        ], 201);
    }

    public function update(Request $request, ZoneReading $reading): JsonResponse
    {
        if (!$this->canModify($request, $reading)) {
            return response()->json(['success' => false, 'message' => 'You can only edit your own readings', 'data' => []], 403);
        }

        $data = $request->validate($this->rules());

        if (!$this->hasAnyValue($data)) {
            return response()->json([
                'success' => false,
                'message' => 'Enter at least one reading (temperature, humidity, soil moisture or pH)',
                'data' => [],
            ], 422);
        }

        $data['recorded_at'] = $data['recorded_at'] ?? $reading->recorded_at;
        $reading->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Reading updated',
            'data' => $this->format($reading->fresh()),
        ]);
    }

    public function destroy(Request $request, ZoneReading $reading): JsonResponse
    {
        if (!$this->canModify($request, $reading)) {
            return response()->json(['success' => false, 'message' => 'You can only delete your own readings', 'data' => []], 403);
        }

        $reading->delete();

        return response()->json(['success' => true, 'message' => 'Reading deleted', 'data' => []]);
    }
}