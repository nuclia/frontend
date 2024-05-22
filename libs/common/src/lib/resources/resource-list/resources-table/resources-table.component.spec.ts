import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesTableComponent } from './resources-table.component';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { FeaturesService, SDKService } from '@flaps/core';
import { BehaviorSubject, of } from 'rxjs';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { DropdownButtonComponent, SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { RouterTestingModule } from '@angular/router/testing';
import { UploadService } from '../../../upload';
import { ResourceListService } from './../resource-list.service';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';

describe('ResourceTableComponent', () => {
  let component: ResourcesTableComponent;
  let fixture: ComponentFixture<ResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourcesTableComponent],
      imports: [
        RouterTestingModule,
        MockModule(TranslateModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
        MockModule(PaDropdownModule),
        MockComponent(DropdownButtonComponent),
        MockComponent(StickyFooterComponent),
        MockComponent(TablePaginationComponent),
      ],
      providers: [
        MockProvider(SDKService, {
          currentAccount: of({ id: '123' } as Account),
          currentKb: of({
            admin: true,
            catalog: jest.fn(() => of()),
            search: jest.fn(() => of()),
          } as unknown as WritableKnowledgeBox),
          nuclia: {
            options: {},
          } as unknown as Nuclia,
        }),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
        MockProvider(TranslateService),
        MockProvider(FeaturesService, {
          isKbAdminOrContrib: of(true),
          authorized: {},
        } as FeaturesService),
        MockProvider(UploadService, {
          statusCount: of({ processed: 0, pending: 0, error: 0 }),
        }),
        MockProvider(ResourceListService, {
          filters: of([]),
          loadResources: jest.fn(() => of()),
          isShardReady: new BehaviorSubject(false),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
