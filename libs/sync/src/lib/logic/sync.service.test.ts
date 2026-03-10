import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SyncService } from './sync.service';
import { MockProvider } from 'ng-mocks';
import { BackendConfigurationService, FeaturesService, NotificationService } from '@flaps/core';
import { of } from 'rxjs';

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
            getOAuthSettings: () => ({
              client_id: 'abc123',
              hydra: 'http://oauth.here',
              auth: 'http://auth.here',
            }),
          },
        },
        MockProvider(NotificationService),
        MockProvider(FeaturesService, {
          unstable: {
            cloudSyncService: of(false),
            sitefinityConnector: of(false),
          },
        } as FeaturesService),
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
