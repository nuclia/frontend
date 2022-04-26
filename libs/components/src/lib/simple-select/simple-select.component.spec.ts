import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SimpleSelectComponent } from './simple-select.component';

describe('SimpleSelectComponent', () => {
  let component: SimpleSelectComponent;
  let fixture: ComponentFixture<SimpleSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
