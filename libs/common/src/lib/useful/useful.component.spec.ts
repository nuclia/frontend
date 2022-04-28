import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { STFUsefulComponent } from './useful.component';

describe('STFUsefulComponent', () => {
  let component: STFUsefulComponent;
  let fixture: ComponentFixture<STFUsefulComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [STFUsefulComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(STFUsefulComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
