import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserContainerComponent } from './user-container.component';
import { MockProvider } from 'ng-mocks';
import { BackendConfigurationService } from '@flaps/core';

describe('UserContainerComponent', () => {
  let component: UserContainerComponent;
  let fixture: ComponentFixture<UserContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserContainerComponent],
      providers: [MockProvider(BackendConfigurationService)],
    }).compileComponents();

    fixture = TestBed.createComponent(UserContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
