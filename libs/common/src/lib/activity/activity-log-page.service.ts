import { computed, inject, Injectable, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ControlModel } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { ActivityLogItem } from '@nuclia/core';
import { unparse } from 'papaparse';
import { ActivityColumnDef } from './activity-column.model';

@Injectable()
export class ActivityLogPageService {
  private datePipe = inject(DatePipe);
  private translate = inject(TranslateService);

  // ── Writable signals ─────────────────────────────────────────────────────

  readonly hiddenColumns = signal<string[]>([]);
  readonly searchTerm = signal<string>('');
  readonly searchMode = signal<string>('');
  readonly data = signal<ActivityLogItem[]>([]);
  readonly columnDefs = signal<ActivityColumnDef[]>([]);
  readonly searchModes = signal<ControlModel[]>([]);
  readonly rangeLabel = signal<string>('');

  // ── Computed signals ─────────────────────────────────────────────────────

  readonly filteredRows = computed(() => {
    const rows = this.data();
    const term = this.searchTerm();
    const mode = this.searchMode();
    const defs = this.columnDefs();

    if (!term) return rows;
    if (defs.length === 0) return rows;
    const lc = term.toLocaleLowerCase();
    if (mode) {
      const colDef = defs.find((c) => c.key === mode);
      if (!colDef) return rows;
      return rows.filter((row) => {
        const v = colDef.value(row);
        return v != null && String(v).toLocaleLowerCase().includes(lc);
      });
    }
    return rows.filter((row) =>
      defs.some((col) => {
        const v = col.value(row);
        return v != null && String(v).toLocaleLowerCase().includes(lc);
      }),
    );
  });

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

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term ?? '');
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

  buildCsvBlob(visibleDefs: ActivityColumnDef[], rows: ActivityLogItem[]): Blob {
    const headers = visibleDefs.map((c) => this.translate.instant(c.label));
    const dataRows = rows.map((row) =>
      visibleDefs.map((col) => {
        const raw = col.value(row);
        return raw != null ? String(raw) : '';
      }),
    );
    return new Blob([unparse([headers, ...dataRows])], { type: 'text/csv;charset=utf-8' });
  }

  buildJsonBlob(visibleDefs: ActivityColumnDef[], rows: ActivityLogItem[]): Blob {
    const data = rows.map((row) => {
      const obj: Record<string, string | number | null> = {};
      visibleDefs.forEach((col) => {
        obj[col.key] = col.value(row) ?? null;
      });
      return obj;
    });
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
    URL.revokeObjectURL(url);
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
