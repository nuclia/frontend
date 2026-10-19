import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, ResourceListService, SDKService, UploadService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { EMPTY, of, Subject } from 'rxjs';
import { ResourceCacheService } from '../resource-cache.service';
import { ResourceListComponent } from './resource-list.component';

describe('ResourceListComponent download action', () => {
  let fixture: ComponentFixture<ResourceListComponent>;
  let component: ResourceListComponent;
  let download: Subject<void>;
  let service: { downloadResources: jest.Mock };
  let toaster: { error: jest.Mock };

  beforeEach(() => {
    download = new Subject<void>();
    service = { downloadResources: jest.fn(() => download) };
    toaster = { error: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { params: EMPTY } },
        { provide: Router, useValue: {} },
        { provide: SDKService, useValue: { currentKb: of({}) } },
        { provide: FeaturesService, useValue: { isKbAdminOrContrib: of(true) } },
        { provide: ResourceCacheService, useValue: { resourceDeleted$: EMPTY } },
        { provide: SisToastService, useValue: toaster },
        {
          provide: UploadService,
          useValue: {
            statusCount: of({}),
            uploadInProgress: of(false),
            refreshNeeded: EMPTY,
          },
        },
        {
          provide: ResourceListService,
          useValue: {
            ...service,
            totalKbResources: of(1),
            filters: of([]),
            ready: EMPTY,
          },
        },
      ],
    }).overrideComponent(ResourceListComponent, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(ResourceListComponent);
    component = fixture.componentInstance;
  });

  it('prevents duplicate downloads and clears loading on completion', () => {
    component.downloadList();
    component.downloadList();

    expect(service.downloadResources).toHaveBeenCalledTimes(1);
    expect(component.downloading).toBe(true);

    download.complete();

    expect(component.downloading).toBe(false);
  });

  it('allows retry and shows a toast when a download fails', () => {
    component.downloadList();
    download.error(new Error('Download failed'));

    expect(component.downloading).toBe(false);
    expect(toaster.error).toHaveBeenCalledWith('generic.error.oops');

    service.downloadResources.mockReturnValueOnce(of(undefined));
    component.downloadList();

    expect(service.downloadResources).toHaveBeenCalledTimes(2);
    expect(component.downloading).toBe(false);
  });

  it('unsubscribes when leaving the resource list', () => {
    component.downloadList();
    fixture.destroy();

    expect(download.observed).toBe(false);
    expect(component.downloading).toBe(false);
  });
});
