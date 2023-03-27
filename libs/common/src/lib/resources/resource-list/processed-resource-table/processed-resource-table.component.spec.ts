import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessedResourceTableComponent } from './processed-resource-table.component';

describe('ResourceTableComponent', () => {
  let component: ProcessedResourceTableComponent;
  let fixture: ComponentFixture<ProcessedResourceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProcessedResourceTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessedResourceTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
