import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { SyncDetailsPageComponent } from './sync-details-page.component';
import { SyncService } from '../logic';
import { SisToastService } from '@nuclia/sistema';
import { of } from 'rxjs';
import { SDKService } from '@flaps/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';

describe('SyncDetailsPageComponent', () => {
  let spectator: SpectatorRouting<SyncDetailsPageComponent>;
  let syncService: SyncService;

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
          }),
        connectors: {
          dropbox: {
            definition: {
              id: 'dropbox',
              title: 'Dropbox',
              logo: `/dropbox.svg`,
              description: 'File storage and synchronization service developed by Dropbox',
              permanentSyncOnly: true,
            },
          },
        },
        updateSync: jest.fn(() => of(undefined)),
      }),
      mockProvider(SvgIconRegistryService, { loadSvg: () => {} }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    syncService = spectator.inject(SyncService);
  });

  it('should display sync', () => {
    expect(spectator.query('h1.page-title')?.textContent).toContain('Test Sync 123');
  });

  it('should toggle the sync status', () => {
    expect(spectator.query('[qa="active-toggle"]')?.textContent).toContain('sync.badge.active');
    spectator.click('[qa="active-toggle"] input');
    spectator.detectChanges();
    expect(syncService.updateSync).toHaveBeenCalledWith('123', { disabled: true });
    spectator.click('[qa="active-toggle"] input');
    spectator.detectChanges();
    expect(syncService.updateSync).toHaveBeenCalledWith('123', { disabled: false });
  });
});
