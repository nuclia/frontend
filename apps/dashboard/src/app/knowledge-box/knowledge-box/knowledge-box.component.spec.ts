import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RouterModule } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import { WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { KnowledgeBoxComponent } from './knowledge-box.component';

describe('KnowledgeBoxComponent', () => {
  let component: KnowledgeBoxComponent;
  let fixture: ComponentFixture<KnowledgeBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [KnowledgeBoxComponent],
      providers: [
        MockProvider(SDKService, {
          counters: of({ resources: 0 }),
          currentKb: of({ id: 'kb', getServiceAccounts: () => of([]) } as unknown as WritableKnowledgeBox),
        } as SDKService),
        MockProvider(SisModalService),
        MockProvider(FeaturesService, { isKbAdmin: of(true) }),
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
