import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterModule } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import { PaScrollModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UploadService } from '../../../upload';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { PendingResourcesTableComponent } from './pending-resources-table.component';

describe('PendingResourcesTableComponent', () => {
  let component: PendingResourcesTableComponent;
  let fixture: ComponentFixture<PendingResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        TranslateModule.forRoot(),
        PendingResourcesTableComponent,
        MockModule(PaScrollModule),
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
        MockProvider(FeaturesService, {
          isKbAdminOrContrib: of(true),
          authorized: {},
        } as FeaturesService),
        MockProvider(UploadService, {
          statusCount: of({ processed: 0, pending: 0, error: 0 }),
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
    }).compileComponents();

    fixture = TestBed.createComponent(PendingResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
