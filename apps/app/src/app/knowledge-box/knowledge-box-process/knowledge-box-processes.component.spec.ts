import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeBoxProcessesComponent } from './knowledge-box-processes.component';

describe('KnowledgeBoxProcessComponent', () => {
  let component: KnowledgeBoxProcessesComponent;
  let fixture: ComponentFixture<KnowledgeBoxProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KnowledgeBoxProcessesComponent ]
    })
    .compileComponents();
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
