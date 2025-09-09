import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterModule } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import {
  PaButtonModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisSearchInputComponent, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UploadService } from '../../../upload/upload.service';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { ErrorResourcesTableComponent } from './error-resources-table.component';

describe('ErrorResourcesTableComponent', () => {
  let component: ErrorResourcesTableComponent;
  let fixture: ComponentFixture<ErrorResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorResourcesTableComponent],
      imports: [
        RouterModule.forRoot([]),
        MockModule(TranslateModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
        MockComponent(StickyFooterComponent),
        MockComponent(TablePaginationComponent),
        MockComponent(SisSearchInputComponent),
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
        MockProvider(UploadService, {
          statusCount: of({ processed: 0, pending: 0, error: 0 }),
        }),
        MockProvider(FeaturesService, {
          isKbAdminOrContrib: of(true),
          authorized: {},
        } as FeaturesService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
