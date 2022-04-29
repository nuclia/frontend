import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipeMock } from '@flaps/core';
import { UserErrorComponent } from './user-error.component';

describe('UserErrorComponent', () => {
  let component: UserErrorComponent;
  let fixture: ComponentFixture<UserErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserErrorComponent, TranslatePipeMock],
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
