import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorResourcesTableComponent } from './error-resources-table.component';

describe('ErrorResourcesTableComponent', () => {
  let component: ErrorResourcesTableComponent;
  let fixture: ComponentFixture<ErrorResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorResourcesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
