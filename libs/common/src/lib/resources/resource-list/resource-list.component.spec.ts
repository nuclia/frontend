import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceListComponent } from './resource-list.component';
import { MockComponent, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LabelsService } from '../../label/labels.service';
import { of } from 'rxjs';
import {
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { UploadButtonComponent } from '../upload-button/upload-button.component';
import { DropdownButtonComponent, SisProgressModule } from '@nuclia/sistema';
import { ReactiveFormsModule } from '@angular/forms';
import { CdkTableModule } from '@angular/cdk/table';

describe('ResourceListComponent', () => {
  let component: ResourceListComponent;
  let fixture: ComponentFixture<ResourceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourceListComponent, MockPipe(TranslatePipe), MockComponent(UploadButtonComponent)],
      imports: [
        RouterTestingModule,
        MockModule(PaDropdownModule),
        MockModule(PaIconModule),
        MockModule(PaPopupModule),
        MockModule(PaTogglesModule),
        MockModule(PaTextFieldModule),
        MockModule(SisProgressModule),
        MockModule(ReactiveFormsModule),
        MockModule(CdkTableModule),
        MockComponent(DropdownButtonComponent),
      ],
      providers: [
        MockProvider(BackendConfigurationService),
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
        MockProvider(TranslateService),
        MockProvider(LabelsService, {
          getLabelsByKind: jest.fn(() => of({})),
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
