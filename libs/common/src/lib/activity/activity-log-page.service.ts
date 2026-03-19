import { computed, inject, Injectable, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ControlModel } from '@guillotinaweb/pastanaga-angular';
import { ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef } from './activity-column.model';

@Injectable()
export class ActivityLogPageService {
  private datePipe = inject(DatePipe);

  // ── Writable signals ─────────────────────────────────────────────────────

  readonly hiddenColumns = signal<string[]>([]);
  readonly searchMode = signal<string>('');
  readonly data = signal<ActivityLogItem[]>([]);
  readonly columnDefs = signal<ActivityColumnDef[]>([]);
  readonly searchModes = signal<ControlModel[]>([]);
  readonly rangeLabel = signal<string>('');

  // ── Computed signals ─────────────────────────────────────────────────────

  readonly filteredRows = computed(() => this.data());

  readonly visibleColumnKeys = computed(() =>
    this.columnDefs()
      .filter((c) => !this.hiddenColumns().includes(c.key))
      .map((c) => c.key),
  );

  readonly gridColumns = computed(() =>
    this.visibleColumnKeys()
      .map((key) => {
        const def = this.columnDefs().find((c) => c.key === key);
        return def?.width ?? '180px';
      })
      .join(' '),
  );

  // ── Methods ───────────────────────────────────────────────────────────────

  setItems(items: ActivityLogItem[]): void {
    this.data.set(items);
  }

  setColumns(defs: ActivityColumnDef[]): void {
    this.columnDefs.set(defs);
    this.hiddenColumns.set(defs.filter((c) => c.defaultHidden).map((c) => c.key));
    this.searchMode.set('');
    this.searchModes.set([
      new ControlModel({ id: 'all', value: '', label: 'activity.search-mode.all' }),
      ...defs.map((col) => new ControlModel({ id: col.key, value: col.key, label: col.label })),
    ]);
  }

  updateSearchMode(mode: string): void {
    this.searchMode.set(mode);
  }

  toggleColumn(key: string): void {
    const current = this.hiddenColumns();
    if (current.includes(key)) {
      this.hiddenColumns.set(current.filter((k) => k !== key));
    } else {
      this.hiddenColumns.set([...current, key]);
    }
  }

  isColumnVisible(key: string): boolean {
    return !this.hiddenColumns().includes(key);
  }

  getCellValue(item: ActivityLogItem, key: string): string {
    const def = this.columnDefs().find((c) => c.key === key);
    if (!def) return '—';
    const raw = def.value(item);
    if (raw == null) return '—';
    if (key === 'date') {
      return this.datePipe.transform(raw as string, 'MMM dd, yyyy') ?? String(raw);
    }
    return String(raw);
  }

  updateRangeLabel(monthValue: string): void {
    if (!monthValue) {
      this.rangeLabel.set('');
      return;
    }
    const [year, month] = monthValue.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    this.rangeLabel.set(this.datePipe.transform(d, 'MMM yyyy') ?? '');
  }

}
