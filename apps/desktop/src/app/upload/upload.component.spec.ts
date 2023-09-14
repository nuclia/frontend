import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { STFTrackingService, TranslatePipeMock } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, NEVER, of } from 'rxjs';
import { ConnectorComponent } from '../connectors/connector/connector.component';
import { ConnectorsComponent } from '../connectors/connectors.component';
import { SyncService } from '../sync/sync.service';
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

xdescribe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let sync: SyncService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadComponent, ConnectorsComponent, ConnectorComponent, TranslatePipeMock, SelectFilesComponent],
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
      ],
      providers: [
        {
          provide: SyncService,
          useValue: {
            sources: { source1: { definition: { id: 'source1' }, settings: {} } },
            destinations: { destination1: { definition: { id: 'destination1' }, settings: {} } },
            addSync: jest.fn(() => of(false)),
            getConnectors: (type: 'sources' | 'destinations') =>
              type === 'sources'
                ? [
                    {
                      id: 'source1',
                      title: 'Source 1',
                      icon: '',
                      description: '',
                    },
                  ]
                : [
                    {
                      id: 'destination1',
                      title: 'Destination 1',
                      icon: '',
                      description: '',
                    },
                  ],
            getDestination: () =>
              of({
                getParameters: () =>
                  of([
                    {
                      id: 'param1',
                      label: 'Param 1',
                      type: 'text',
                    },
                  ]),
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
                id: 'source1',
                title: 'Source 1',
                icon: '',
                description: '',
              },
            ]),
            showFirstStep: NEVER,
            showSource: NEVER,
            step: new BehaviorSubject<number>(0),
            setStep: (step: number) => {
              (sync.step as BehaviorSubject<number>).next(step);
            },
            setSourceData: () => of(),
            getCurrentSourceId: () => 'sync-1',
          },
        },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
        MockProvider(STFTrackingService),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sync = TestBed.inject(SyncService);
  });

  it('should allow to add a new sync', () => {
    jest.spyOn(sync, 'setStep');
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    expect(sync.setStep).toHaveBeenCalledWith(1);
    fixture.detectChanges();
    let connectors = fixture.debugElement.query(By.css('nde-connectors'));
    fixture.debugElement.nativeElement.querySelector('pa-input[formcontrolname="name"]').value = 'Sync 1';
    connectors.triggerEventHandler('selectConnector', {
      name: 'sync-1',
      connector: {},
      params: {},
      permanentSync: false,
    });
    component.source = {
      hasServerSideAuth: false,
      isExternal: false,
      getParameters: () => of([]),
      getParametersValues: () => ({}),
      goToOAuth: () => {},
      authenticate: () => of(true),
    };
    sync.setStep(2);
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector('[qa="next"]').click();
    expect(sync.setStep).toHaveBeenCalledWith(3);
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    fixture.detectChanges();
    connectors = fixture.debugElement.query(By.css('nde-connectors'));
    connectors.triggerEventHandler('selectConnector', {
      name: 'kb-1',
      connector: {},
      params: {},
    });
    fixture.detectChanges();
    expect(sync.addSync).toHaveBeenCalled();
  });
});
