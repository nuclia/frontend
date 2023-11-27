import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, SDKService, STFTrackingService, TranslatePipeMock } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, NEVER, of } from 'rxjs';
import { ConnectorComponent } from '../connectors/connector/connector.component';
import { ConnectorsComponent } from '../connectors/connectors.component';
import { SyncService } from '../sync/sync.service';
import { SettingsComponent } from './settings/settings.component';
import { SelectFilesComponent } from './select-files/select-files.component';

import { UploadComponent } from './upload.component';
import {
  PaButtonModule,
  PaCardModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { MockModule, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { FileStatus } from '../sync/models';
import { LabelModule } from '@flaps/common';

let currentSourceId: string | null = null;
const fileTitle = 'File title';
const connectorId = 'connector1';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let sync: SyncService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        UploadComponent,
        ConnectorsComponent,
        ConnectorComponent,
        TranslatePipeMock,
        SelectFilesComponent,
        SettingsComponent,
      ],
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MockModule(PaButtonModule),
        MockModule(PaTextFieldModule),
        MockModule(PaCardModule),
        MockModule(PaTogglesModule),
        MockModule(PaIconModule),
        MockModule(LabelModule),
      ],
      providers: [
        {
          provide: SyncService,
          useValue: {
            sources: { [connectorId]: { definition: { id: connectorId }, settings: {} } },
            destinations: { nucliacloud: { definition: { id: 'nucliacloud' }, settings: {} } },
            addSync: jest.fn(() => of(false)),
            getDestination: () =>
              of({
                getParameters: () => of([{ id: 'kb' }]),
              }),
            getSource: () =>
              of({
                authenticate: () => of(true),
                getParameters: () => of([]),
              }),
            currentSource: of({
              permanentSync: false,
            }),
            sourceObs: of([
              {
                id: connectorId,
                title: 'Connector title',
                icon: '',
                description: '',
              },
            ]),
            getSourceCache: () => of([{}]),
            addSource: NEVER,
            showSource: NEVER,
            step: new BehaviorSubject<number>(0),
            setStep: (step: number) => {
              (sync.step as BehaviorSubject<number>).next(step);
            },
            currentSourceId: of(currentSourceId),
            setCurrentSourceId: (value: string) => (currentSourceId = value),
            getCurrentSourceId: () => currentSourceId,
            clearCurrentSourceId: () => (currentSourceId = null),
            hasCurrentSourceAuth: () => of(true),
            canSelectFiles: () => true,
            getFiles: () =>
              of({
                items: [
                  {
                    uuid: '',
                    title: fileTitle,
                    originalId: '',
                    metadata: {},
                    status: FileStatus.PENDING,
                  },
                ],
              }),
          },
        },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
        {
          provide: SDKService,
          useValue: {
            currentAccount: of({
              type: 'test-type',
            }),
            kbList: of([]),
            setCurrentKnowledgeBox: () => of(undefined),
            currentKb: of({
              id: 'testKb',
              getLabels: jest.fn(() => of({})),
            }),
          },
        },
        MockProvider(STFTrackingService),
        MockProvider(BackendConfigurationService),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sync = TestBed.inject(SyncService);
  });

  it('should create new source', fakeAsync(() => {
    jest.spyOn(sync, 'setStep');
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    expect(sync.setStep).toHaveBeenCalledWith(1);

    fixture.detectChanges();
    const name = fixture.debugElement.nativeElement.querySelector('pa-input[formcontrolname="name"]');
    expect(name).toBeTruthy();

    const settings = fixture.debugElement.query(By.css('nsy-settings'));
    settings.triggerEventHandler('save', {
      name: 'sync-1',
      connectorId: connectorId,
    });
    tick(600);
    expect(sync.setStep).toHaveBeenCalledWith(2);

    fixture.detectChanges();
    const selectFiles = fixture.debugElement.query(By.css('nsy-select-files'));
    selectFiles.componentInstance.ngAfterViewInit();
    tick(300);
    fixture.detectChanges();
    const file = fixture.debugElement.query(By.css('table pa-checkbox'));
    expect(file.nativeElement.textContent.trim() === fileTitle).toBeTruthy();
    flush();
  }));
});
