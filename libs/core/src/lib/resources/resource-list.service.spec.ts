import { TestBed } from '@angular/core/testing';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { TranslateService } from '@ngx-translate/core';
import { IResource, LabelSets } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, firstValueFrom, of, take } from 'rxjs';
import { SDKService } from '../api';
import { LabelsService } from '../label';
import { UploadService } from '../upload';
import { ResourceListService } from './resource-list.service';
import { ResourceNavigationService } from './resource-navigation.service';

describe('ResourceListService optional columns', () => {
  let labelSets: BehaviorSubject<LabelSets | null>;
  let resources: BehaviorSubject<{ type: string; resources: Record<string, IResource> }>;
  let catalog: jest.Mock;
  let storage: { getItem: jest.Mock; setItem: jest.Mock };

  beforeEach(() => {
    labelSets = new BehaviorSubject<LabelSets | null>({});
    resources = new BehaviorSubject<{ type: string; resources: Record<string, IResource> }>({
      type: 'searchResults',
      resources: {},
    });
    catalog = jest.fn(() => resources.pipe(take(1)));
    storage = {
      getItem: jest.fn(() => JSON.stringify({ columns: ['classification'] })),
      setItem: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        ResourceListService,
        { provide: SDKService, useValue: { currentKb: of({ id: 'kb', catalog }), nuclia: {} } },
        { provide: LabelsService, useValue: { resourceLabelSets: labelSets } },
        { provide: TranslateService, useValue: {} },
        { provide: UploadService, useValue: { statusCount: of({ processed: 0, pending: 0, error: 0 }) } },
        { provide: SisToastService, useValue: {} },
        { provide: ResourceNavigationService, useValue: {} },
        { provide: LOCAL_STORAGE, useValue: storage },
      ],
    });
  });

  it('requires configured labels and reacts to additions and removals without changing column preferences', () => {
    const service = TestBed.inject(ResourceListService);
    const availability: boolean[] = [];
    const subscription = service.hasLabels.subscribe((value) => availability.push(value));
    const labelSet = { title: 'Topics', kind: [], labels: [] };

    labelSets.next({ topics: labelSet });
    labelSets.next({ topics: { ...labelSet, labels: [{ title: 'News' }] } });
    labelSets.next({});

    expect(availability).toEqual([false, true, false]);
    service.selectedColumns.subscribe((columns) => expect(columns).toEqual(['classification'])).unsubscribe();
    expect(storage.setItem).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it('waits until label sets are loaded', () => {
    const service = TestBed.inject(ResourceListService);
    const availability: boolean[] = [];
    labelSets.next(null);
    const subscription = service.hasLabels.subscribe((value) => availability.push(value));

    expect(availability).toEqual([]);
    labelSets.next({ topics: { title: 'Topics', kind: [], labels: [{ title: 'News' }] } });
    expect(availability).toEqual([true]);
    subscription.unsubscribe();
  });

  it('is true when any label set has labels, even if others are empty', async () => {
    labelSets.next({
      empty: { title: 'Empty', kind: [], labels: [] },
      topics: { title: 'Topics', kind: [], labels: [{ title: 'News' }] },
    });

    expect(await firstValueFrom(TestBed.inject(ResourceListService).hasLabels)).toBe(true);
  });

  it('only emits when availability changes', () => {
    const service = TestBed.inject(ResourceListService);
    const availability: boolean[] = [];
    const subscription = service.hasLabels.subscribe((value) => availability.push(value));
    const withLabels = (title: string): LabelSets => ({ topics: { title: 'Topics', kind: [], labels: [{ title }] } });

    labelSets.next(withLabels('News'));
    labelSets.next(withLabels('Sports'));
    labelSets.next({ other: { title: 'Other', kind: [], labels: [{ title: 'Misc' }] } });
    labelSets.next({ empty: { title: 'Empty', kind: [], labels: [] } });
    labelSets.next({});

    expect(availability).toEqual([false, true, false]);
    subscription.unsubscribe();
  });
});
