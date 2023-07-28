import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingResourcesTableComponent } from './pending-resources-table.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaScrollModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

describe('PendingResourcesTableComponent', () => {
  let component: PendingResourcesTableComponent;
  let fixture: ComponentFixture<PendingResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingResourcesTableComponent],
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
          isAdminOrContrib: of(true),
          nuclia: {
            options: {},
          } as unknown as Nuclia,
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
