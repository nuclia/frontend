import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SyncService } from './sync.service';
import { MockProvider } from 'ng-mocks';
import { BackendConfigurationService, NotificationService } from '@flaps/core';

describe('SyncService', () => {
  let service: SyncService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: BackendConfigurationService,
          useValue: {
            getAPIURL: () => 'http://backend',
            staticConf: { client: 'dashboard' },
          },
        },
        MockProvider(NotificationService),
        SyncService,
      ],
    });
    service = TestBed.inject(SyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should trigger sync', () => {
    const syncId = '123';
    const resyncAll = false;
    service.triggerSync(syncId, resyncAll).subscribe();
    const req = httpMock.expectOne(`${service.getSyncServer()}/sync/execute/${syncId}`);
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('should re-sync all by resetting the last sync date', () => {
    const syncId = '123';
    const resyncAll = true;
    service.triggerSync(syncId, resyncAll).subscribe();
    const req1 = httpMock.expectOne(`${service.getSyncServer()}/sync/${syncId}`);
    expect(req1.request.method).toBe('PATCH');
    expect(req1.request.body).toEqual({ lastSyncGMT: '1970-01-01' });
    req1.flush(null);
    const req2 = httpMock.expectOne(`${service.getSyncServer()}/sync/execute/${syncId}`);
    expect(req2.request.method).toBe('GET');
    req2.flush(null);
  });
});
