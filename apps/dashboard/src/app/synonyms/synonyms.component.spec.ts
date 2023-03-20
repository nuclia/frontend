import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SynonymsComponent } from './synonyms.component';

describe('SynonymsComponent', () => {
  let component: SynonymsComponent;
  let fixture: ComponentFixture<SynonymsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SynonymsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SynonymsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
