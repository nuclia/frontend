import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingResourcesTableComponent } from './pending-resources-table.component';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { FeaturesService, SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { RouterTestingModule } from '@angular/router/testing';
import { SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { UploadService } from '../../../upload';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';

describe('PendingResourcesTableComponent', () => {
  let component: PendingResourcesTableComponent;
  let fixture: ComponentFixture<PendingResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingResourcesTableComponent],
      imports: [
        RouterTestingModule,
        MockModule(TranslateModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
