import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { MissingKnowledgeDetailsComponent } from './missing-knowledge-details.component';

describe('MissingKnowledgeDetailsComponent', () => {
  let component: MissingKnowledgeDetailsComponent;
  let fixture: ComponentFixture<MissingKnowledgeDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingKnowledgeDetailsComponent],
    })
      .overrideComponent(MissingKnowledgeDetailsComponent, {
        set: {
          imports: [MockModule(TranslateModule)],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MissingKnowledgeDetailsComponent);
    component = fixture.componentInstance;

    // Set required signal inputs before first detectChanges
    fixture.componentRef.setInput('item', { id: 1, question: 'test' });
    fixture.componentRef.setInput('missingKnowledgeDetails', {});
    fixture.componentRef.setInput('missingKnowledgeError', {});

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
