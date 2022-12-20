import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipeMock } from '@flaps/core';
import { UserErrorComponent } from './user-error.component';
import { OldUserContainerComponent } from '../user-container/old-user-container.component';
import { UserContainerLogoComponent } from '../user-container/user-container-logo/user-container-logo.component';

describe('UserErrorComponent', () => {
  let component: UserErrorComponent;
  let fixture: ComponentFixture<UserErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserErrorComponent, TranslatePipeMock, OldUserContainerComponent, UserContainerLogoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserErrorComponent);
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
