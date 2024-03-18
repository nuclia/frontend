import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessedResourceTableComponent } from './processed-resource-table.component';
import { MockModule, MockProvider } from 'ng-mocks';
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
import { of } from 'rxjs';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { DropdownButtonComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { RouterTestingModule } from '@angular/router/testing';

describe('ResourceTableComponent', () => {
  let component: ProcessedResourceTableComponent;
  let fixture: ComponentFixture<ProcessedResourceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessedResourceTableComponent],
      imports: [
        RouterTestingModule,
        MockModule(TranslateModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
        MockModule(PaDropdownModule),
        DropdownButtonComponent,
      ],
      providers: [
        MockProvider(SDKService, {
          currentAccount: of({ id: '123' } as Account),
          currentKb: of({
            admin: true,
            catalog: jest.fn(() => of()),
            search: jest.fn(() => of()),
          } as unknown as WritableKnowledgeBox),
          isAdminOrContrib: of(true),
          nuclia: {
            options: {},
          } as unknown as Nuclia,
        }),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
        MockProvider(TranslateService),
        MockProvider(FeaturesService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessedResourceTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
