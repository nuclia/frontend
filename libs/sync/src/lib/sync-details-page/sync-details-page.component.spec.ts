import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { ITranslateService, Language, TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { of } from 'rxjs';
import { SyncService } from '../logic';
import { SyncDetailsPageComponent } from './sync-details-page.component';

describe('SyncDetailsPageComponent', () => {
  let fixture: ComponentFixture<SyncDetailsPageComponent>;
  let element: HTMLElement;
  let syncService: SyncService;

  const fakeTranslateService: Partial<ITranslateService> = {
    currentLang: signal<Language | null>('en'),
    fallbackLang: signal<Language | null>('en'),
    translate: (key: string | string[] | (() => string | string[])) =>
      signal(`[${typeof key === 'function' ? key() : key}]`),
    instant: (key: string | string[]) => `[${key as string}]`,
    get: (key: string | string[]) => of(`[${key as string}]`),
  };

  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SyncDetailsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { params: of({ syncId: '123' }), url: of([]), queryParams: of({}) } },
        { provide: SisToastService, useValue: { error: jest.fn(), success: jest.fn() } },
        { provide: TranslateService, useValue: fakeTranslateService as unknown as TranslateService },
        {
          provide: SDKService,
          useValue: {
            currentKb: of({
              id: 'testKb',
              getLabels: () => of({}),
            }),
          },
        },
        {
          provide: SyncService,
          useValue: {
            setCurrentSyncId: jest.fn(),
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
          },
        },
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
        {
          provide: NavigationService,
          useValue: {
            kbUrl: of('/test-kb-url'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncDetailsPageComponent);
    element = fixture.nativeElement;
    syncService = TestBed.inject(SyncService);
    fixture.detectChanges();
  });

  it('should display sync activity', () => {
    expect(element.querySelector('h1.page-title')?.textContent).toContain('Test Sync 123');
    expect(element.querySelector('.activity-logs-container')?.textContent).toContain('Synchronization finished');
  });

  it('should toggle the sync activity status', () => {
    expect(element.querySelector('[data-cy="active-toggle"]')?.textContent).toContain('sync.badge.active');
    element.querySelector<HTMLInputElement>('[data-cy="active-toggle"] input')!.click();
    fixture.detectChanges();
    expect(syncService.updateSync).toHaveBeenCalledWith('123', { disabled: true });
    element.querySelector<HTMLInputElement>('[data-cy="active-toggle"] input')!.click();
    fixture.detectChanges();
    expect(syncService.updateSync).toHaveBeenCalledWith('123', { disabled: false });
  });

  it('should open confirm dialog when triggering sync', () => {
    const modalService = TestBed.inject(SisModalService);
    const openConfirm = jest.spyOn(modalService, 'openConfirm');
    element.querySelector<HTMLElement>('[data-cy="sync-now"]')!.click();
    fixture.detectChanges();
    expect(openConfirm).toHaveBeenCalled();
  });

  it('should open confirm dialog when deleting sync', () => {
    const modalService = TestBed.inject(SisModalService);
    const openConfirm = jest.spyOn(modalService, 'openConfirm');
    element.querySelector<HTMLElement>('[data-cy="delete"]')!.click();
    fixture.detectChanges();
    expect(openConfirm).toHaveBeenCalled();
  });
});
