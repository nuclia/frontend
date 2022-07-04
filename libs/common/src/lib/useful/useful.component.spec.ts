import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { STFTrackingService } from '@flaps/core';
import { TranslatePipeMock } from '@flaps/core';

import { STFUsefulComponent } from './useful.component';

describe('STFUsefulComponent', () => {
  let component: STFUsefulComponent;
  let fixture: ComponentFixture<STFUsefulComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [STFUsefulComponent, TranslatePipeMock],
      providers: [
        {
          provide: STFTrackingService,
          useValue: {
            successResult: () => {},
          },
        },
      ],
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

  afterEach(() => {
    fixture.destroy();
  });
});
