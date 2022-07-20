import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, TranslatePipeMock } from '@flaps/core';
import { of } from 'rxjs';

import { KnowledgeBoxProcessesComponent } from './knowledge-box-processes.component';

describe('KnowledgeBoxProcessComponent', () => {
  let component: KnowledgeBoxProcessesComponent;
  let fixture: ComponentFixture<KnowledgeBoxProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KnowledgeBoxProcessesComponent, TranslatePipeMock],
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({ getStatus: () => 'not_running' }),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
