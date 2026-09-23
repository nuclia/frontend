import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterModule } from '@angular/router';
import {
  BackendConfigurationService,
  FeaturesService,
  LabelsService,
  NavigationService,
  SDKService,
} from '@flaps/core';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { DropdownButtonComponent, SisModalService, SisSearchInputComponent, SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UploadService } from '../../upload/upload.service';
import { UploadButtonComponent } from '../upload-button/upload-button.component';
import { ErrorResourcesTableComponent } from './error-resources-table/error-resources-table.component';
import { PendingResourcesTableComponent } from './pending-resources-table/pending-resources-table.component';
import { ProcessedResourcesTableComponent } from './processed-resources-table/processed-resources-table.component';
import { ResourceListComponent } from './resource-list.component';
import { ResourceListService } from './resource-list.service';
import { ResourcesTableComponent } from './resources-table/resources-table.component';

describe('ResourceListComponent', () => {
  let component: ResourceListComponent;
  let fixture: ComponentFixture<ResourceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), TranslateModule.forRoot(), ResourceListComponent],
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
        MockProvider(LabelsService, {
          resourceLabelSets: of({}),
        }),
        MockProvider(UploadService, {
          updateStatusCount: jest.fn(() => of({ processed: 0, pending: 0, error: 0 })),
          refreshNeeded: of(false),
          statusCount: of({ processed: 0, pending: 0, error: 0 }),
        }),
        MockProvider(NavigationService),
        MockProvider(FeaturesService, {
          isKbAdminOrContrib: of(true),
          authorized: {},
        } as FeaturesService),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
        MockProvider(ResourceListService, {
          filters: of([]),
          ready: of(true),
          totalKbResources: of(1),
          data: of([]),
          page: of(0),
          pageSize: of(25),
          totalItems: of(0),
          totalPages: of([]),
          query: of(''),
          labelSets: of({}),
        }),
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
      ],
    });

    // Real ResourcesTableComponent/ProcessedResourcesTableComponent bake in the real LabelModule,
    // which conflicts with ng-mocks' TestBed-level mocking. Override the SUT's own standalone
    // imports directly instead so the real LabelModule never gets pulled in at all.
    TestBed.overrideComponent(ResourceListComponent, {
      remove: {
        imports: [
          UploadButtonComponent,
          ErrorResourcesTableComponent,
          PendingResourcesTableComponent,
          ProcessedResourcesTableComponent,
          ResourcesTableComponent,
          DropdownButtonComponent,
          SisSearchInputComponent,
          TranslatePipe,
          TranslateModule,
        ],
      },
      add: {
        imports: [
          MockComponent(UploadButtonComponent),
          MockComponent(ErrorResourcesTableComponent),
          MockComponent(PendingResourcesTableComponent),
          MockComponent(ProcessedResourcesTableComponent),
          MockComponent(ResourcesTableComponent),
          MockComponent(DropdownButtonComponent),
          MockComponent(SisSearchInputComponent),
          MockPipe(TranslatePipe, (key: string) => key),
        ],
      },
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ResourceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be there', () => {
    expect(component).toBeTruthy();
  });
});
