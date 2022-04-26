import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AccountBaseComponent } from './account-base.component';

describe('AccountBaseComponent', () => {
  let component: AccountBaseComponent;
  let fixture: ComponentFixture<AccountBaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
