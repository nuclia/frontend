import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ResourceListService } from '@flaps/common';
import {
  BackendConfigurationService,
  FeaturesService,
  LabelDropdownComponent,
  LabelsService,
  NavigationService,
  SDKService,
} from '@flaps/core';
import { PaDropdownModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DropdownButtonComponent, SisProgressModule, SisSearchInputComponent } from '@nuclia/sistema';
import { MockComponent, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UploadService } from '../../upload/upload.service';
import { UploadButtonComponent } from '../upload-button/upload-button.component';
import { ErrorResourcesTableComponent } from './error-resources-table/error-resources-table.component';
import { PendingResourcesTableComponent } from './pending-resources-table/pending-resources-table.component';
import { ResourceListComponent } from './resource-list.component';
import { ResourcesTableComponent } from './resources-table/resources-table.component';

describe('ResourceListComponent', () => {
  let component: ResourceListComponent;
  let fixture: ComponentFixture<ResourceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ResourceListComponent,
        MockPipe(TranslatePipe),
        MockComponent(UploadButtonComponent),
        MockComponent(ErrorResourcesTableComponent),
        MockComponent(PendingResourcesTableComponent),
        MockComponent(ResourcesTableComponent),
        MockComponent(LabelDropdownComponent),
        MockComponent(SisSearchInputComponent),
      ],
      imports: [
        RouterModule.forRoot([]),
        MockModule(PaDropdownModule),
        MockModule(PaIconModule),
        MockModule(PaTogglesModule),
        MockModule(PaTextFieldModule),
        MockModule(SisProgressModule),
        MockModule(ReactiveFormsModule),
        MockComponent(DropdownButtonComponent),
      ],
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({
              id: 'testKb',
              getLabels: jest.fn(() => of({})),
              listResources: () => of({ resources: [] }),
            }),
            currentAccount: of({
              type: 'test-type',
            }),
            counters: of({ resources: 0 }),
            nuclia: {
              options: {
                zone: 'europe',
              },
              db: {
                getProcessingStatus: jest.fn(() =>
                  of({
                    shared: { last_delivered_seqid: 1 },
                    account: { last_delivered_seqid: 2 },
                  }),
                ),
              },
            },
          },
        },
        MockProvider(BackendConfigurationService),
        MockProvider(TranslateService, {
          instant: jest.fn(() => ''),
          stream: jest.fn(() => of('')),
        }),
        MockProvider(LabelsService, {
          resourceLabelSets: of({}),
        }),
        MockProvider(UploadService, {
          updateStatusCount: jest.fn(() => of({ processed: 0, pending: 0, error: 0 })),
          refreshNeeded: of(false),
        }),
        MockProvider(NavigationService),
        MockProvider(FeaturesService),
        MockProvider(ResourceListService, {
          filters: of([]),
          ready: of(true),
          totalKbResources: of(1),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be there', () => {
    expect(component).toBeTruthy();
  });
});
