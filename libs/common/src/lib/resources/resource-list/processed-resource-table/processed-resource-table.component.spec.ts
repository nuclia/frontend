import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessedResourceTableComponent } from './processed-resource-table.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { DropdownButtonComponent } from '@nuclia/sistema';

describe('ResourceTableComponent', () => {
  let component: ProcessedResourceTableComponent;
  let fixture: ComponentFixture<ProcessedResourceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessedResourceTableComponent],
      imports: [
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
          currentKb: of({ admin: true } as unknown as WritableKnowledgeBox),
          nuclia: {
            options: {},
          } as unknown as Nuclia,
        }),
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
