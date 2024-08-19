import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';

import { KnowledgeBoxComponent } from './knowledge-box.component';
import { MockProvider } from 'ng-mocks';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, SDKService } from '@flaps/core';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchWidgetService } from '@flaps/common';

describe('KnowledgeBoxComponent', () => {
  let component: KnowledgeBoxComponent;
  let fixture: ComponentFixture<KnowledgeBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [KnowledgeBoxComponent],
      providers: [
        MockProvider(SDKService, { counters: of({ resources: 0 }), currentKb: of({}) } as SDKService),
        MockProvider(SisModalService),
        MockProvider(FeaturesService, { isKbAdmin: of(true) }),
        MockProvider(SearchWidgetService, { migrateConfigsAndWidgets: () => of() }),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
