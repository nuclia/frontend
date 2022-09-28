import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { STFTrackingService, TranslatePipeMock } from '@flaps/core';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ConnectorComponent } from '../connectors/connector/connector.component';
import { ConnectorsComponent } from '../connectors/connectors.component';
import { StepsComponent } from './steps/steps.component';
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
import { ConfirmFilesComponent } from './confirm-files/confirm-files.component';

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
        StepsComponent,
        TranslatePipeMock,
        SelectFilesComponent,
        ConfirmFilesComponent,
      ],
      imports: [
        NoopAnimationsModule,
        RouterTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
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
            addSync: jest.fn(),
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
    expect(component.step).toEqual(0);
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    expect(component.step).toEqual(1);
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector('[qa="next"]').click();
    expect(component.step).toEqual(2);
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector('[qa="fields-form"]').submit();
    fixture.detectChanges();
    (document.querySelector('[qa="confirm"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(sync.addSync).toHaveBeenCalled();
  });
});
