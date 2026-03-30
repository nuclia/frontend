import { TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ActivityLogItem } from '@nuclia/core';
import { MetricsPageService } from './metrics-page.service';
import { MetricsColumnDef } from './metrics-column.model';

const MOCK_DEFS: MetricsColumnDef[] = [
  { key: 'question', label: 'activity.question', value: (item) => (item as any).question, searchable: true },
  {
    key: 'answer',
    label: 'activity.answer',
    value: (item) => (item as any).answer,
    defaultHidden: true,
    searchable: true,
  },
  { key: 'status', label: 'activity.status', value: (item) => (item as any).status, searchable: true },
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

    it('sets searchMode to the first searchable column', () => {
      service.setColumns(MOCK_DEFS);
      expect(service.searchMode()).toBe('question');
    });

    it('generates searchModes from searchable columns', () => {
      service.setColumns(MOCK_DEFS);
      const modes = service.searchModes();
      expect(modes).toHaveLength(MOCK_DEFS.length);
      expect(modes[0].value).toBe('question');
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

  describe('data signal', () => {
    beforeEach(() => {
      service.setColumns(MOCK_DEFS);
      service.setItems(MOCK_ROWS);
    });

    it('returns all rows via filteredRows', () => {
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
