import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { SyncDetailsPageComponent } from './sync-details-page.component';
import { SyncService } from '../logic';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { of } from 'rxjs';
import { SDKService } from '@flaps/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';

describe('SyncDetailsPageComponent', () => {
  let spectator: SpectatorRouting<SyncDetailsPageComponent>;
  let syncService: SyncService;

  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  const createService = createRoutingFactory({
    component: SyncDetailsPageComponent,
    params: { syncId: '123' },
    imports: [
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateFakeLoader,
        },
      }),
    ],
    mocks: [SisToastService],
    providers: [
      TranslateService,
      mockProvider(SDKService, {
        currentKb: of({
          id: 'testKb',
          getLabels: () => of({}),
        }),
      }),
      mockProvider(SyncService, {
        cacheUpdated: of(new Date().toISOString()),
        getSync: (syncId: string) =>
          of({
            id: syncId,
            title: 'Test Sync 123',
            connector: {
              name: 'dropbox',
            },
            foldersToSync: [
              { uuid: 'folder1', title: 'Folder 1', originalId: 'folder1', metadata: { displayPath: '/folder1' } },
            ],
          }),
        connectors: {
          dropbox: {
            definition: {
              id: 'dropbox',
              title: 'Dropbox',
              logo: `/dropbox.svg`,
              description: 'File storage and synchronization service developed by Dropbox',
              permanentSyncOnly: true,
              allowToSelectFolders: true,
            },
          },
        },
        getConnector: jest.fn(() => ({
          allowToSelectFolders: true,
          canSyncLastChanges: true,
          getParametersSections: () => of([]),
        })),
        updateSync: jest.fn(() => of(undefined)),
        isSyncing: of(false),
        syncJobs: of([]),
        getLogs: jest.fn(() =>
          of([
            {
              message: 'Synchronization finished',
              level: 'low',
              createdAt: '2024-06-03T07:15:42.978Z',
              action: 'finish-synchronization-sync-object',
              payload: {
                from: '9512775a-1a27-4c03-a8ea-8cddd3f38958-gdrive6-ajtiyi',
                to: '9512775a-1a27-4c03-a8ea-8cddd3f38958',
                date: '2024-06-03T07:15:42.978Z',
                processed: [],
                successCount: 0,
                error: '',
              },
            },
          ]),
        ),
      }),
      mockProvider(SvgIconRegistryService, { loadSvg: () => {} }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    syncService = spectator.inject(SyncService);
  });

  it('should display sync activity', () => {
    expect(spectator.query('h1.page-title')?.textContent).toContain('Test Sync 123');
    expect(spectator.query('.activity-logs-container')?.textContent).toContain('Synchronization finished');
  });

  it('should toggle the sync activity status', () => {
    expect(spectator.query('[data-cy="active-toggle"]')?.textContent).toContain('sync.badge.active');
    spectator.click('[data-cy="active-toggle"] input');
    spectator.detectChanges();
    expect(syncService.updateSync).toHaveBeenCalledWith('123', { disabled: true });
    spectator.click('[data-cy="active-toggle"] input');
    spectator.detectChanges();
    expect(syncService.updateSync).toHaveBeenCalledWith('123', { disabled: false });
  });

  it('should open confirm dialog when triggering sync', () => {
    const modalService = spectator.inject(SisModalService);
    const openConfirm = jest.spyOn(modalService, 'openConfirm');
    spectator.click('[data-cy="sync-now"]');
    spectator.detectChanges();
    expect(openConfirm).toHaveBeenCalled();
  });

  it('should open confirm dialog when deleting sync', () => {
    const modalService = spectator.inject(SisModalService);
    const openConfirm = jest.spyOn(modalService, 'openConfirm');
    spectator.click('[data-cy="delete"]');
    spectator.detectChanges();
    expect(openConfirm).toHaveBeenCalled();
  });
});
