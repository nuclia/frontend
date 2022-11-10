import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UserAvatarSimpleComponent } from './user-avatar-simple.component';

describe('UserAvatarSimpleComponent', () => {
  let component: UserAvatarSimpleComponent;
  let fixture: ComponentFixture<UserAvatarSimpleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UserAvatarSimpleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAvatarSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
