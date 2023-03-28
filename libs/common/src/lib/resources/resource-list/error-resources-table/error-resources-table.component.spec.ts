import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorResourcesTableComponent } from './error-resources-table.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { Nuclia, WritableKnowledgeBox } from '@nuclia/core';

describe('ErrorResourcesTableComponent', () => {
  let component: ErrorResourcesTableComponent;
  let fixture: ComponentFixture<ErrorResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorResourcesTableComponent],
      imports: [
        MockModule(TranslateModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
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

    fixture = TestBed.createComponent(ErrorResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
