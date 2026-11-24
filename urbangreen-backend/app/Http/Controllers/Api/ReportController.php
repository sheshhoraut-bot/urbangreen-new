<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CareTask;
use App\Models\Zone;
use App\Models\Plant;
use App\Models\PlantJournalEntry;
use App\Models\ReportLog;
use App\Models\ZoneReading;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    private const LABELS = [
        'zones' => 'Zones',
        'plants' => 'Plants',
        'readings' => 'Readings',
        'care_tasks' => 'Care Tasks',
    ];

    public function index(Request $request): JsonResponse
    {
        $logs = ReportLog::where('user_id', $request->user()->id)
            ->orderByDesc('generated_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'message' => 'Report history retrieved',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:zones,plants,readings,care_tasks'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        [$headers, $rows] = match ($validated['type']) {
            'zones' => $this->zonesData(),
            'plants' => $this->plantsData(),
            'readings' => $this->readingsData(),
            'care_tasks' => $this->careTasksData(),
        };

        $title = $validated['name'] ?? (self::LABELS[$validated['type']] . ' Report');
        $filename = str_replace(' ', '_', $title) . '_' . now()->format('Y-m-d_His') . '.pdf';
        $path = 'reports/' . $filename;

        $pdf = Pdf::loadView('reports.table', [
            'title' => $title,
            'headers' => $headers,
            'rows' => $rows,
            'generatedAt' => now()->format('M j, Y g:i A'),
        ]);

        Storage::disk('public')->put($path, $pdf->output());

        $log = ReportLog::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'filters' => null,
            'format' => 'pdf',
            'file_path' => $path,
            'generated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report generated successfully',
            'data' => [
                'log' => $log,
                'filename' => $filename,
                'download_url' => asset('storage/' . $path),
                'row_count' => count($rows),
            ],
        ], 201);
    }

    public function download(ReportLog $reportLog): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless($reportLog->user_id === request()->user()->id, 403);

        return Storage::disk('public')->download($reportLog->file_path);
    }

    private function zonesData(): array
    {
        $headers = ['ID', 'Name', 'Description', 'Status', 'Plants', 'Created'];
        $rows = Zone::withCount('plants')->get()->map(fn ($z) => [
            $z->id, $z->name, $z->description, $z->status, $z->plants_count, $z->created_at->format('M j, Y'),
        ])->toArray();
        return [$headers, $rows];
    }

    private function plantsData(): array
    {
        $dash = "\u{2014}";
        $headers = [
            'ID', 'Name', 'Species', 'Zone', 'Status',
            'Growth Stage', 'Height (cm)', 'Harvested', 'Last Journal Entry', 'Created',
        ];

        $plants = Plant::with('zone')->get();
        $entries = PlantJournalEntry::orderBy('entry_date')->orderBy('id')->get()->groupBy('plant_id');

        $rows = $plants->map(function ($p) use ($entries, $dash) {
            $list = $entries->get($p->id, collect());

            $latest = $list->last();
            $stage = $list->whereNotNull('growth_stage')->last()?->growth_stage;
            $height = $list->whereNotNull('height_cm')->last()?->height_cm;

            $harvest = $list
                ->where('is_harvest', true)
                ->whereNotNull('harvest_amount')
                ->groupBy(fn ($e) => $e->harvest_unit ?? '')
                ->map(fn ($group, $unit) => trim(($group->sum('harvest_amount') + 0) . ' ' . $unit))
                ->values()
                ->implode(', ');

            return [
                $p->id,
                $p->name,
                $p->species,
                $p->zone?->name,
                $p->status,
                $stage ? ucfirst($stage) : $dash,
                $height !== null ? $height : $dash,
                $harvest !== '' ? $harvest : $dash,
                $latest ? $latest->entry_date->format('M j, Y') : $dash,
                $p->created_at->format('M j, Y'),
            ];
        })->toArray();

        return [$headers, $rows];
    }

    private function readingsData(): array
    {
        $dash = "\u{2014}";
        $headers = [
            'ID', 'Zone', 'Recorded', 'Temp (' . "\u{00B0}" . 'C)', 'Humidity (%)', 'Soil Moisture (%)', 'pH', 'Logged By', 'Notes',
        ];

        $rows = ZoneReading::with(['zone:id,name', 'user:id,name'])
            ->where('recorded_at', '>=', now()->subDays(30))
            ->orderByDesc('recorded_at')
            ->limit(500)
            ->get()
            ->map(fn ($r) => [
                $r->id,
                $r->zone?->name ?? $dash,
                $r->recorded_at->format('M j, Y g:i A'),
                $r->temperature ?? $dash,
                $r->humidity ?? $dash,
                $r->soil_moisture ?? $dash,
                $r->ph ?? $dash,
                $r->user?->name ?? $dash,
                $r->notes ?: $dash,
            ])->toArray();

        return [$headers, $rows];
    }

    private function careTasksData(): array
    {
        $dash = "\u{2014}";
        $headers = [
            'ID', 'Title', 'Type', 'Plant', 'Zone', 'Assigned To', 'Due Date', 'Status', 'Completed', 'Completed By',
        ];

        $rows = CareTask::with(['plant:id,name', 'zone:id,name', 'assignee:id,name', 'completer:id,name'])
            ->orderBy('due_date')
            ->get()
            ->map(function ($t) use ($dash) {
                $status = $t->status === 'completed'
                    ? 'Completed'
                    : ($t->due_date->lt(today()) ? 'Overdue' : 'Pending');

                return [
                    $t->id,
                    $t->title,
                    ucfirst(str_replace('_', ' ', $t->type)),
                    $t->plant?->name ?? $dash,
                    $t->zone?->name ?? $dash,
                    $t->assignee?->name ?? 'Unassigned',
                    $t->due_date->format('M j, Y'),
                    $status,
                    $t->completed_at ? $t->completed_at->format('M j, Y g:i A') : $dash,
                    $t->completer?->name ?? $dash,
                ];
            })->toArray();

        return [$headers, $rows];
    }
}