import { TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ActivityLogItem } from '@nuclia/core';
import { MetricsPageService } from './metrics-page.service';
import { MetricsColumnDef } from './metrics-column.model';

const MOCK_DEFS: MetricsColumnDef[] = [
  { key: 'question', label: 'activity.question', value: (item) => (item as any).question },
  {
    key: 'answer',
    label: 'activity.answer',
    value: (item) => (item as any).answer,
    defaultHidden: true,
  },
  { key: 'status', label: 'activity.status', value: (item) => (item as any).status },
];

const MOCK_ROWS = [
  { question: 'hello world', answer: 'yes', status: 'OK' },
  { question: 'test query', answer: 'no', status: 'ERROR' },
] as unknown as ActivityLogItem[];

describe('MetricsPageService', () => {
  let service: MetricsPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MetricsPageService,
        DatePipe,
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
      ],
    });
    service = TestBed.inject(MetricsPageService);
  });

  describe('setColumns()', () => {
    it('updates columnDefs to the provided definitions', () => {
      service.setColumns(MOCK_DEFS);
      expect(service.columnDefs()).toBe(MOCK_DEFS);
    });

    it('sets hiddenColumns to keys of defaultHidden columns only', () => {
      service.setColumns(MOCK_DEFS);
      expect(service.hiddenColumns()).toEqual(['answer']);
    });

    it('resets searchMode to empty string', () => {
      service.updateSearchMode('question');
      service.setColumns(MOCK_DEFS);
      expect(service.searchMode()).toBe('');
    });

    it('regenerates searchModes with one "all" entry + one entry per column', () => {
      service.setColumns(MOCK_DEFS);
      const modes = service.searchModes();
      expect(modes).toHaveLength(MOCK_DEFS.length + 1);
    });

    it('places the "all" mode (value="") first in searchModes', () => {
      service.setColumns(MOCK_DEFS);
      expect(service.searchModes()[0].value).toBe('');
    });
  });

  describe('toggleColumn()', () => {
    beforeEach(() => {
      service.setColumns(MOCK_DEFS); // hiddenColumns starts as ['answer']
    });

    it('hides a visible column', () => {
      service.toggleColumn('status');
      expect(service.hiddenColumns()).toContain('status');
    });

    it('shows a hidden column', () => {
      service.toggleColumn('answer');
      expect(service.hiddenColumns()).not.toContain('answer');
    });

    it('does not affect other hidden columns when showing one', () => {
      service.toggleColumn('question'); // hide it first
      service.toggleColumn('answer');   // show answer
      expect(service.hiddenColumns()).not.toContain('answer');
      expect(service.hiddenColumns()).toContain('question');
    });
  });

  describe('isColumnVisible()', () => {
    beforeEach(() => {
      service.setColumns(MOCK_DEFS); // hiddenColumns = ['answer']
    });

    it('returns true for a non-hidden column', () => {
      expect(service.isColumnVisible('question')).toBe(true);
    });

    it('returns false for a hidden column', () => {
      expect(service.isColumnVisible('answer')).toBe(false);
    });
  });

  describe('filteredRows computed', () => {
    beforeEach(() => {
      service.setColumns(MOCK_DEFS);
      service.setItems(MOCK_ROWS);
    });

    it('returns all rows when search term is empty', () => {
      expect(service.filteredRows()).toHaveLength(2);
    });

    it('searches across all columns when no mode is set', () => {
      service.updateSearchTerm('hello');
      const results = service.filteredRows();
      expect(results).toHaveLength(1);
      expect((results[0] as any).question).toBe('hello world');
    });

    it('is case-insensitive when filtering', () => {
      service.updateSearchTerm('HELLO');
      expect(service.filteredRows()).toHaveLength(1);
    });

    it('searches only the specified column when a mode is set', () => {
      service.updateSearchMode('status');
      service.updateSearchTerm('error');
      const results = service.filteredRows();
      expect(results).toHaveLength(1);
      expect((results[0] as any).status).toBe('ERROR');
    });

    it('returns all rows when mode column key does not exist in defs', () => {
      service.updateSearchMode('nonexistent_key');
      service.updateSearchTerm('hello');
      expect(service.filteredRows()).toHaveLength(2);
    });
  });

  describe('getCellValue()', () => {
    const DEFS_WITH_NULL: MetricsColumnDef[] = [
      { key: 'question', label: 'activity.question', value: (item) => (item as any).question },
      { key: 'answer', label: 'activity.answer', value: (item) => (item as any).answer },
    ];
    const item = { question: 'hello', answer: null } as unknown as ActivityLogItem;

    beforeEach(() => {
      service.setColumns(DEFS_WITH_NULL);
    });

    it('returns "—" when the column value is null', () => {
      expect(service.getCellValue(item, 'answer')).toBe('—');
    });

    it('returns "—" when the column def is not found', () => {
      expect(service.getCellValue(item, 'unknown_key')).toBe('—');
    });

    it('returns the string value for a regular (non-date) key', () => {
      expect(service.getCellValue(item, 'question')).toBe('hello');
    });
  });
});
