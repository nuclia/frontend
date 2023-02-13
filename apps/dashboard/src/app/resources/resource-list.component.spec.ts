import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { BackendConfigurationService, SDKService, TranslatePipeMock } from '@flaps/core';

import { ResourceListComponent } from './resource-list.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule, MockProvider } from 'ng-mocks';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { CdkTableModule } from '@angular/cdk/table';
import { LabelModule } from '../components/label/label.module';
import { ResourceViewerService } from './resource-viewer.service';
import { ReactiveFormsModule } from '@angular/forms';

describe('ResourceListComponent', () => {
  let component: ResourceListComponent;
  let fixture: ComponentFixture<ResourceListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CdkTableModule,
        MatDialogModule,
        MockModule(PaButtonModule),
        MockModule(PaTextFieldModule),
        MockModule(LabelModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [ResourceListComponent, TranslatePipeMock],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({
              id: 'testKb',
              getLabels: jest.fn(() => of({})),
              listResources: () => of({ resources: [] }),
            }),
            counters: of({ resources: 0 }),
            refreshing: of(true),
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
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: {
              queryParams: {},
            },
          },
        },
        {
          provide: Router,
          useValue: {},
        },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
        MockProvider(BackendConfigurationService),
        MockProvider(ResourceViewerService),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be there', () => {
    expect(component).toBeTruthy();
  });
});
