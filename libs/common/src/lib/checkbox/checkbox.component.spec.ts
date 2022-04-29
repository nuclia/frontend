import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { STFCheckboxComponent } from './checkbox.component';

describe('STFCheckboxComponent', () => {
  let component: STFCheckboxComponent;
  let fixture: ComponentFixture<STFCheckboxComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [STFCheckboxComponent],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(STFCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
