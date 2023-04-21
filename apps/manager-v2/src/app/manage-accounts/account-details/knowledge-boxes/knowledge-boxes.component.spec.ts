import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KnowledgeBoxesComponent } from './knowledge-boxes.component';

describe('KnowledgeBoxesComponent', () => {
  let component: KnowledgeBoxesComponent;
  let fixture: ComponentFixture<KnowledgeBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KnowledgeBoxesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KnowledgeBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
