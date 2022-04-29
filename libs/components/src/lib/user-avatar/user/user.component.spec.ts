import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UsersService } from '@flaps/core';
import { of } from 'rxjs';

import { UserComponent } from './user.component';

describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [UserComponent],
        providers: [{ provide: UsersService, useValue: { getAccountUser: () => of({ name: 'me', avatar: '' }) } }],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
